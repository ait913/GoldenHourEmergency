import { prisma } from '../prisma/client'
import { findNearbyMedicals } from './location.service'
import { notifyUser } from './sse.service'
import { sendSms } from './sms.service'
import type { Emergency, EmergencyResponseSummary, NearbyMedical } from '../types'

/**
 * 緊急通報を作成する
 * 1. DBに保存
 * 2. 近隣医療従事者を検索
 * 3. SSE通知を送信
 * 4. SMS通知を送信（SSE未接続の医療従事者へ）
 */
export async function createEmergency(
  reporterId: number,
  lat: number,
  lng: number,
  symptoms: string[]
): Promise<{ emergencyId: number }> {
  // DBに保存
  const emergency = await prisma.emergency.create({
    data: {
      reporterId,
      lat,
      lng,
      symptoms,
      status: 'PENDING',
    },
  })

  // 近隣医療従事者を検索（半径2km）
  const nearbyMedicals = await findNearbyMedicals(lat, lng, 2000)

  // 近隣医療従事者への通知（エラーが発生しても緊急通報作成は成功とする）
  if (nearbyMedicals.length > 0) {
    const notifyPromises = nearbyMedicals.map(async (medical) => {
      try {
        // SSE通知
        await notifyUser(medical.userId, {
          type: 'emergency',
          emergencyId: emergency.id,
          symptoms: emergency.symptoms,
          lat: emergency.lat,
          lng: emergency.lng,
          distanceMeters: medical.distanceMeters,
        })

        // SMS通知（オフラインバックアップ）
        const medUser = await prisma.user.findUnique({
          where: { id: medical.userId },
        })
        if (medUser) {
          await sendSms(
            medUser.phoneNumber,
            `【GoldenHourHelper】緊急通報が届きました。\n症状: ${symptoms.join('、') || 'なし'}\n距離: 約${Math.round(medical.distanceMeters)}m\nアプリを確認してください。`
          )
        }
      } catch (error) {
        console.error(
          `[emergency.service] Failed to notify medical ${medical.userId}:`,
          error
        )
      }
    })

    await Promise.allSettled(notifyPromises)
  }

  return { emergencyId: emergency.id }
}

/**
 * 緊急通報を取得する（応答者情報を含む）
 */
export async function getEmergencyById(id: number): Promise<Emergency | null> {
  const emergency = await prisma.emergency.findUnique({
    where: { id },
    include: {
      responses: {
        include: {
          responder: {
            select: { id: true, name: true },
          },
        },
      },
    },
  })

  if (!emergency) {
    return null
  }

  const responses: EmergencyResponseSummary[] = emergency.responses.map(
    (r) => ({
      responderId: r.responderId,
      responderName: r.responder.name,
      action: r.action as 'ACCEPTED' | 'DECLINED',
    })
  )

  return {
    id: emergency.id,
    reporterId: emergency.reporterId,
    symptoms: emergency.symptoms as Emergency['symptoms'],
    lat: emergency.lat,
    lng: emergency.lng,
    status: emergency.status as Emergency['status'],
    createdAt: emergency.createdAt.toISOString(),
    responses,
  }
}

/**
 * 緊急通報への応答を記録する
 * accept: status を RESPONDING に更新
 * decline: status は変更しない
 */
export async function respondToEmergency(
  emergencyId: number,
  responderId: number,
  action: 'accept' | 'decline'
): Promise<void> {
  const dbAction = action === 'accept' ? 'ACCEPTED' : 'DECLINED'

  // 応答レコードを作成
  await prisma.emergencyResponse.create({
    data: {
      emergencyId,
      responderId,
      action: dbAction,
    },
  })

  // accept の場合は緊急通報のステータスを RESPONDING に更新
  if (action === 'accept') {
    await prisma.emergency.update({
      where: { id: emergencyId },
      data: { status: 'RESPONDING' },
    })
  }

  // 通報者にSSE通知（response_update）
  const emergency = await prisma.emergency.findUnique({
    where: { id: emergencyId },
    include: {
      responses: {
        include: {
          responder: {
            select: { id: true, name: true },
          },
        },
      },
    },
  })

  if (emergency) {
    const responses: EmergencyResponseSummary[] = emergency.responses.map(
      (r) => ({
        responderId: r.responderId,
        responderName: r.responder.name,
        action: r.action as 'ACCEPTED' | 'DECLINED',
      })
    )

    await notifyUser(emergency.reporterId, {
      type: 'response_update',
      emergencyId,
      responses,
    })
  }
}

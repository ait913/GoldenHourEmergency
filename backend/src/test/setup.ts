import { prisma } from '../prisma/client'

beforeEach(async () => {
  // テーブルをクリア（外部キー順）
  // DB不要なテスト（AED等）ではDBが起動していない場合があるためエラーを無視
  try {
    await prisma.emergencyResponse.deleteMany()
    await prisma.emergency.deleteMany()
    await prisma.medicalProfile.deleteMany()
    await prisma.user.deleteMany()
  } catch {
    // DB未接続の場合はスキップ（Prisma不要なテストでは問題なし）
  }
})

afterAll(async () => {
  try {
    await prisma.$disconnect()
  } catch {
    // ignore
  }
})

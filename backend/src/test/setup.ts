import { prisma } from '../prisma/client'

beforeEach(async () => {
  // テーブルをクリア（外部キー順）
  await prisma.emergencyResponse.deleteMany()
  await prisma.emergency.deleteMany()
  await prisma.medicalProfile.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})

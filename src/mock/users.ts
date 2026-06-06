import { User } from '@/types'

export const mockUsers: User[] = [
  {
    id: '1',
    name: '全网管理员',
    role: 'national',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  },
  {
    id: '2',
    name: '广东省中心',
    role: 'provincial',
    province: '广东省',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guangdong',
  },
  {
    id: '3',
    name: '京港澳高速段',
    role: 'segment',
    province: '广东省',
    segmentId: 'G4-GD',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jinggangao',
  },
]

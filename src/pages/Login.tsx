import { useState } from 'react'
import { Form, Input, Select, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/store/auth'
import { UserRole } from '@/types'

const Login = () => {
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((state) => state.login)

  const onFinish = (values: { username: string; password: string; role: UserRole }) => {
    setLoading(true)
    setTimeout(() => {
      const success = login(values.username, values.password, values.role)
      if (success) {
        message.success('登录成功')
      } else {
        message.error('登录失败，请检查用户名和角色')
      }
      setLoading(false)
    }, 500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400 rounded-full opacity-20 blur-3xl"></div>
      </div>
      
      <Card className="w-full max-w-md mx-4 shadow-2xl backdrop-blur-sm bg-white/95" bordered={false}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <SafetyCertificateOutlined className="text-3xl text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">高速公路智能分析平台</h1>
          <p className="text-gray-500 mt-2">全国路网运行监测与收费稽查</p>
        </div>

        <Form
          name="login"
          initialValues={{ role: 'national' }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="role"
            rules={[{ required: true, message: '请选择用户角色' }]}
          >
            <Select
              prefix={<UserOutlined className="text-gray-400" />}
              options={[
                { label: '全网管理员', value: 'national' },
                { label: '省中心用户', value: 'provincial' },
                { label: '路段管理用户', value: 'segment' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="用户名：全网管理员 / 广东省中心 / 京港澳高速段"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="密码（任意输入即可）"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full" loading={loading}>
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center text-sm text-gray-400 mt-6">
          <p>演示账号：选择角色后，输入对应用户名即可登录</p>
        </div>
      </Card>
    </div>
  )
}

export default Login

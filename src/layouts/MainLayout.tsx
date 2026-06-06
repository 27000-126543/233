import { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Badge, Breadcrumb } from 'antd'
import {
  DashboardOutlined,
  MonitorOutlined,
  WarningOutlined,
  CalendarOutlined,
  AuditOutlined,
  FileTextOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { warningEvents } from '@/mock/data'

const { Header, Sider, Content } = Layout

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">核心看板</Link>,
    },
    {
      key: '/monitor',
      icon: <MonitorOutlined />,
      label: <Link to="/monitor">实时监测</Link>,
    },
    {
      key: '/warning',
      icon: <WarningOutlined />,
      label: (
        <Badge dot count={warningEvents.filter(w => w.status === 'pending').length} size="small">
          <Link to="/warning">预警中心</Link>
        </Badge>
      ),
    },
    {
      key: '/holiday',
      icon: <CalendarOutlined />,
      label: <Link to="/holiday">节假日方案</Link>,
    },
    {
      key: '/audit',
      icon: <AuditOutlined />,
      label: <Link to="/audit">收费稽查</Link>,
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: <Link to="/reports">运营报告</Link>,
    },
  ]

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout()
        navigate('/login')
      },
    },
  ]

  const getRoleName = () => {
    switch (user?.role) {
      case 'national': return '全网级'
      case 'provincial': return '省级'
      case 'segment': return '路段级'
      default: return ''
    }
  }

  const getBreadcrumb = () => {
    const pathMap: Record<string, string> = {
      '/dashboard': '核心看板',
      '/monitor': '实时监测',
      '/warning': '预警中心',
      '/holiday': '节假日方案',
      '/audit': '收费稽查',
      '/reports': '运营报告',
    }
    return pathMap[location.pathname] || '首页'
  }

  return (
    <Layout className="min-h-screen">
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div className="h-16 flex items-center justify-center border-b border-gray-700">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <MonitorOutlined className="text-white" />
              </div>
              <span className="text-white font-semibold text-sm">路网监测平台</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <MonitorOutlined className="text-white" />
            </div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="border-none"
        />
      </Sider>
      <Layout>
        <Header className="bg-white px-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>
            <Breadcrumb>
              <Breadcrumb.Item>首页</Breadcrumb.Item>
              <Breadcrumb.Item>{getBreadcrumb()}</Breadcrumb.Item>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-4">
            <Badge count={warningEvents.filter(w => w.status === 'pending').length} size="small">
              <button className="text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <BellOutlined className="text-lg" />
              </button>
            </Badge>
            
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                <Avatar size="small" src={user?.avatar} icon={<UserOutlined />} />
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-gray-800">{user?.name}</div>
                  <div className="text-xs text-gray-500">{getRoleName()}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="m-4 overflow-auto">
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout

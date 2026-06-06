import { useState } from 'react'
import {
  Row,
  Col,
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Timeline,
  Steps,
  Statistic,
  Space,
  message,
} from 'antd'
import {
  WarningOutlined,
  CarOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { warningEvents } from '@/mock/data'
import { WarningEvent, ApprovalRecord } from '@/types'
import dayjs from 'dayjs'
import { useAuthStore } from '@/store/auth'

const { Step } = Steps
const { TextArea } = Input

const EarlyWarning = () => {
  const user = useAuthStore((state) => state.user)
  const [warnings, setWarnings] = useState<WarningEvent[]>(warningEvents)
  const [selectedWarning, setSelectedWarning] = useState<WarningEvent | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [approvalModalVisible, setApprovalModalVisible] = useState(false)
  const [form] = Form.useForm()

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'congestion': return <CarOutlined className="text-red-500" />
      case 'efficiency': return <ThunderboltOutlined className="text-orange-500" />
      case 'accident': return <WarningOutlined className="text-yellow-500" />
      case 'evasion': return <EyeOutlined className="text-purple-500" />
      default: return <WarningOutlined />
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case 'congestion': return '拥堵预警'
      case 'efficiency': return '效率预警'
      case 'accident': return '事故预警'
      case 'evasion': return '逃费预警'
      default: return '未知'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'congestion': return 'red'
      case 'efficiency': return 'orange'
      case 'accident': return 'gold'
      case 'evasion': return 'purple'
      default: return 'default'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'primary': return 'red'
      case 'secondary': return 'orange'
      case 'tertiary': return 'blue'
      default: return 'default'
    }
  }

  const getLevelName = (level: string) => {
    switch (level) {
      case 'primary': return '一级'
      case 'secondary': return '二级'
      case 'tertiary': return '三级'
      default: return '未知'
    }
  }

  const getStatusName = (status: string) => {
    switch (status) {
      case 'pending': return '待监控员确认'
      case 'confirmed': return '待路段主任复核'
      case 'reviewed': return '待路网中心批准'
      case 'approved': return '已批准'
      case 'resolved': return '已处理'
      default: return '未知'
    }
  }

  const getCurrentStep = (status: string) => {
    switch (status) {
      case 'pending': return 0
      case 'confirmed': return 1
      case 'reviewed': return 2
      case 'approved':
      case 'resolved': return 3
      default: return 0
    }
  }

  const canApprove = (status: string) => {
    if (user?.role === 'national') {
      return status === 'reviewed'
    }
    if (user?.role === 'provincial') {
      return status === 'confirmed'
    }
    if (user?.role === 'segment') {
      return status === 'pending'
    }
    return false
  }

  const getApprovalRole = () => {
    if (user?.role === 'national') return 'center'
    if (user?.role === 'provincial') return 'director'
    return 'monitor'
  }

  const getApprovalRoleName = () => {
    if (user?.role === 'national') return '路网中心'
    if (user?.role === 'provincial') return '路段主任'
    return '监控员'
  }

  const handleApproval = (action: 'approve' | 'reject') => {
    form.validateFields().then(values => {
      if (selectedWarning) {
        const newApproval: ApprovalRecord = {
          id: `A${Date.now()}`,
          role: getApprovalRole() as any,
          userId: user?.id || '',
          userName: `${getApprovalRoleName()}${user?.name || ''}`,
          action,
          comment: values.comment,
          timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        }

        const newStatus = action === 'approve'
          ? (selectedWarning.status === 'pending' ? 'confirmed' :
             selectedWarning.status === 'confirmed' ? 'reviewed' :
             selectedWarning.status === 'reviewed' ? 'approved' : selectedWarning.status)
          : selectedWarning.status

        setWarnings(prev => prev.map(w =>
          w.id === selectedWarning.id
            ? { ...w, approvals: [...w.approvals, newApproval], status: newStatus as any }
            : w
        ))
        message.success(action === 'approve' ? '审批通过' : '已驳回')
        setApprovalModalVisible(false)
        form.resetFields()
      }
    })
  }

  const columns = [
    {
      title: '预警类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getTypeColor(type)} icon={getTypeIcon(type)}>
          {getTypeName(type)}
        </Tag>
      ),
      filters: [
        { text: '拥堵预警', value: 'congestion' },
        { text: '效率预警', value: 'efficiency' },
        { text: '事故预警', value: 'accident' },
        { text: '逃费预警', value: 'evasion' },
      ],
      onFilter: (value: any, record: WarningEvent) => record.type === value,
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => <Tag color={getLevelColor(level)}>{getLevelName(level)}</Tag>,
    },
    { title: '标题', dataIndex: 'title', key: 'title', render: (t: string) => <span className="font-medium">{t}</span> },
    { title: '位置', dataIndex: 'location', key: 'location' },
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag>{getStatusName(status)}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: WarningEvent) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedWarning(record); setDetailModalVisible(true) }}>
            查看
          </Button>
          {canApprove(record.status) && (
            <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => { setSelectedWarning(record); setApprovalModalVisible(true) }}>
              审批
            </Button>
          )}
        </Space>
      )
    }
  ]

  const pendingCount = warnings.filter(w => w.status === 'pending').length
  const processingCount = warnings.filter(w => w.status === 'confirmed' || w.status === 'reviewed').length
  const resolvedCount = warnings.filter(w => w.status === 'approved' || w.status === 'resolved').length

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">预警中心</h1>
        <p className="text-gray-500 text-sm mt-1">拥堵预警、通行效率预警与三级审批流程管理</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <div className="stat-card stat-card-error">
            <Statistic
              title={<span className="flex items-center gap-2"><ClockCircleOutlined /> 待处理预警</span>}
              value={pendingCount}
              valueStyle={{ color: '#f5222d' }}
              suffix="件"
            />
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div className="stat-card stat-card-warning">
            <Statistic
              title={<span className="flex items-center gap-2"><WarningOutlined /> 审批中</span>}
              value={processingCount}
              valueStyle={{ color: '#faad14' }}
              suffix="件"
            />
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div className="stat-card stat-card-success">
            <Statistic
              title={<span className="flex items-center gap-2"><CheckOutlined /> 已处理</span>}
              value={resolvedCount}
              valueStyle={{ color: '#52c41a' }}
              suffix="件"
            />
          </div>
        </Col>
      </Row>

      <Card className="data-card" title="预警事件列表">
        <Table
          columns={columns}
          dataSource={warnings}
          rowKey="id"
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Modal
        title="预警详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={
          <Space>
            {selectedWarning && canApprove(selectedWarning.status) && (
              <Button type="primary" icon={<CheckOutlined />} onClick={() => { setApprovalModalVisible(true); setDetailModalVisible(false) }}>
                处理审批
              </Button>
            )}
            <Button onClick={() => setDetailModalVisible(false)}>关闭</Button>
          </Space>
        }
      >
        {selectedWarning && (
          <div className="space-y-6">
            <div>
              <Tag color={getTypeColor(selectedWarning.type)} icon={getTypeIcon(selectedWarning.type)}>
                {getTypeName(selectedWarning.type)}
              </Tag>
              <Tag color={getLevelColor(selectedWarning.level)}>{getLevelName(selectedWarning.level)}预警</Tag>
              <h3 className="text-lg font-bold mt-2">{selectedWarning.title}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-gray-500">位置：</span>
                <span className="font-medium">{selectedWarning.location}</span>
              </div>
              <div>
                <span className="text-gray-500">时间：</span>
                <span className="font-medium">{selectedWarning.timestamp}</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">预警描述</h4>
              <p className="text-gray-600">{selectedWarning.description}</p>
            </div>

            <div>
              <h4 className="font-medium mb-3">审批流程</h4>
              <Steps direction="vertical" current={getCurrentStep(selectedWarning.status)}>
                <Step title="监控员确认" description="监控人员核实预警信息" />
                <Step title="路段主任复核" description="路段管理中心主任复核" />
                <Step title="路网中心批准" description="省级路网中心批准处置方案" />
                <Step title="执行处置" description="执行限流或诱导方案" />
              </Steps>
            </div>

            {selectedWarning.approvals.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">审批记录</h4>
                <Timeline>
                  {selectedWarning.approvals.map(approval => (
                    <Timeline.Item key={approval.id}>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium">{approval.userName}</span>
                          <Tag color={approval.action === 'approve' ? 'green' : 'red'} className="ml-2">
                            {approval.action === 'approve' ? '通过' : '驳回'}
                          </Tag>
                          <p className="text-gray-600 mt-1">{approval.comment}</p>
                        </div>
                        <span className="text-gray-400 text-sm">{approval.timestamp}</span>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title={`${getApprovalRoleName()}审批`}
        open={approvalModalVisible}
        onCancel={() => { setApprovalModalVisible(false); form.resetFields() }}
        footer={null}
        width={600}
      >
        {selectedWarning && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium">{selectedWarning.title}</p>
              <p className="text-sm text-gray-500 mt-1">{selectedWarning.description}</p>
            </div>

            <Form form={form} layout="vertical">
              <Form.Item
                name="comment"
                label="审批意见"
                rules={[{ required: true, message: '请输入审批意见' }]}
              >
                <TextArea rows={4} placeholder="请输入审批意见..." />
              </Form.Item>

              <Form.Item className="mb-0">
                <Space className="w-full justify-end">
                  <Button onClick={() => handleApproval('reject')} icon={<CloseOutlined />} danger>
                    驳回
                  </Button>
                  <Button type="primary" onClick={() => handleApproval('approve')} icon={<CheckOutlined />}>
                    通过
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default EarlyWarning

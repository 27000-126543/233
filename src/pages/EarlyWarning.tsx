import { useState, useEffect, useCallback } from 'react'
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
  Alert,
} from 'antd'
import {
  WarningOutlined,
  CarOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import { roadSegments, tollStations, warningEvents } from '@/mock/data'
import { WarningEvent, ApprovalRecord } from '@/types'
import dayjs from 'dayjs'
import { useAuthStore } from '@/store/auth'

const { Step } = Steps
const { TextArea } = Input

const STORAGE_KEY = 'highway_warnings'

const loadWarningsFromStorage = (): WarningEvent[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('加载预警数据失败', e)
  }
  return [...warningEvents]
}

const saveWarningsToStorage = (warnings: WarningEvent[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(warnings))
  } catch (e) {
    console.error('保存预警数据失败', e)
  }
}

const EarlyWarning = () => {
  const user = useAuthStore((state) => state.user)
  const [warnings, setWarnings] = useState<WarningEvent[]>(loadWarningsFromStorage)
  const [selectedWarning, setSelectedWarning] = useState<WarningEvent | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [approvalModalVisible, setApprovalModalVisible] = useState(false)
  const [autoWarningEnabled, setAutoWarningEnabled] = useState(true)
  const [congestionAboveThreshold, setCongestionAboveThreshold] = useState<string[]>([])
  const [efficiencyBelowThreshold, setEfficiencyBelowThreshold] = useState<string[]>([])
  const [form] = Form.useForm()

  useEffect(() => {
    saveWarningsToStorage(warnings)
  }, [warnings])

  const generateWarning = useCallback((type: 'congestion' | 'efficiency', targetId: string, targetName: string, value: number) => {
    const warningId = `W-${type}-${targetId}-${dayjs().format('YYYYMMDDHHmmss')}`
    
    setWarnings(prev => {
      const existingWarning = prev.find(w => w.id.startsWith(`W-${type}-${targetId}`) && (w.status === 'pending' || w.status === 'confirmed' || w.status === 'reviewed'))
      if (existingWarning) return prev

      const newWarning: WarningEvent = {
        id: warningId,
        type,
        level: 'primary',
        title: type === 'congestion'
          ? `${targetName} 拥堵指数超过0.8`
          : `${targetName} 通行效率低于70%`,
        description: type === 'congestion'
          ? `${targetName} 持续拥堵，当前拥堵指数 ${value.toFixed(2)}，超过阈值0.8，请及时处置。`
          : `${targetName} 通行效率下降至 ${value.toFixed(1)}%，低于阈值70%，可能存在ETC设备故障或车道关闭。`,
        location: targetName,
        timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        status: 'pending',
        approvals: [],
        segmentId: type === 'congestion' ? targetId : undefined,
        stationId: type === 'efficiency' ? targetId : undefined,
      }

      const newWarnings = [newWarning, ...prev]
      saveWarningsToStorage(newWarnings)
      message.warning(`自动预警：${newWarning.title}`)
      return newWarnings
    })
  }, [])

  useEffect(() => {
    if (!autoWarningEnabled) return

    const interval = setInterval(() => {
      const congestedSegments = roadSegments.filter(s => s.congestionIndex > 0.8)
      const congestedNames = congestedSegments.map(s => s.name)
      setCongestionAboveThreshold(congestedNames)
      congestedSegments.forEach(seg => generateWarning('congestion', seg.id, seg.name, seg.congestionIndex))

      const lowEfficiencyStations = tollStations.filter(s => s.efficiency < 70)
      const lowEffNames = lowEfficiencyStations.map(s => s.name)
      setEfficiencyBelowThreshold(lowEffNames)
      lowEfficiencyStations.forEach(st => generateWarning('efficiency', st.id, st.name, st.efficiency))
    }, 10000)

    return () => clearInterval(interval)
  }, [autoWarningEnabled, generateWarning])

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

  const handleMarkResolved = (id: string) => {
    setWarnings(prev => prev.map(w =>
      w.id === id ? { ...w, status: 'resolved' as const } : w
    ))
    message.success('预警已标记为已处理')
  }

  const handleClearAll = () => {
    Modal.confirm({
      title: '确认清除所有预警？',
      content: '此操作将清空所有预警记录，但不会影响自动预警功能。',
      onOk: () => {
        setWarnings([])
        message.success('已清除所有预警记录')
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
      render: (status: string) => (
        <Tag color={status === 'resolved' ? 'green' : status === 'approved' ? 'blue' : 'gold'}>
          {getStatusName(status)}
        </Tag>
      ),
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
          {(record.status === 'approved' || record.status === 'resolved') && (
            <Button type="link" size="small" onClick={() => handleMarkResolved(record.id)} disabled={record.status === 'resolved'}>
              标记处理
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">预警中心</h1>
          <p className="text-gray-500 text-sm mt-1">拥堵预警、通行效率预警与三级审批流程管理</p>
        </div>
        <Space>
          <Button
            icon={<SyncOutlined spin={autoWarningEnabled} />}
            type={autoWarningEnabled ? 'primary' : 'default'}
            onClick={() => setAutoWarningEnabled(!autoWarningEnabled)}
          >
            {autoWarningEnabled ? '自动预警开启' : '自动预警关闭'}
          </Button>
          <Button icon={<SaveOutlined />} onClick={() => { saveWarningsToStorage(warnings); message.success('数据已保存到本地') }}>
            保存数据
          </Button>
          <Button danger onClick={handleClearAll}>
            清除全部
          </Button>
        </Space>
      </div>

      {(congestionAboveThreshold.length > 0 || efficiencyBelowThreshold.length > 0) && (
        <Alert
          type="warning"
          showIcon
          message={
            <div className="space-y-1">
              {congestionAboveThreshold.length > 0 && (
                <p>⚠️ 当前拥堵路段：{congestionAboveThreshold.join('、')}（拥堵指数 {'>'} 0.8）</p>
              )}
              {efficiencyBelowThreshold.length > 0 && (
                <p>⚠️ 当前低效率收费站：{efficiencyBelowThreshold.join('、')}（通行效率 {'<'} 70%）</p>
              )}
            </div>
          }
        />
      )}

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

      <Card className="data-card" title="预警事件列表（自动生成，数据持久化到localStorage）">
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

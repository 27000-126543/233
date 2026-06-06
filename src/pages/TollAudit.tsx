import { useState } from 'react'
import {
  Row,
  Col,
  Card,
  Table,
  Tag,
  Progress,
  Statistic,
  Tabs,
  List,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Descriptions,
} from 'antd'
import {
  EyeOutlined,
  AlertOutlined,
  CheckOutlined,
  DollarOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { evasionCases, vehicleRecords } from '@/mock/data'
import { EvasionCase } from '@/types'

const { TabPane } = Tabs
const { Option } = Select
const { TextArea } = Input

const TollAudit = () => {
  const [cases, setCases] = useState<EvasionCase[]>(evasionCases)
  const [selectedCase, setSelectedCase] = useState<EvasionCase | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [auditModalVisible, setAuditModalVisible] = useState(false)
  const [form] = Form.useForm()

  const getRiskColor = (score: number) => {
    if (score >= 80) return '#f5222d'
    if (score >= 60) return '#faad14'
    return '#52c41a'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'investigating': return 'orange'
      case 'confirmed': return 'red'
      case 'resolved': return 'green'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'investigating': return '稽查中'
      case 'confirmed': return '已确认'
      case 'resolved': return '已处理'
      default: return '未知'
    }
  }

  const handleAudit = (action: 'confirm' | 'resolve') => {
    form.validateFields().then(() => {
      if (selectedCase) {
        setCases(prev => prev.map(c =>
          c.id === selectedCase.id
            ? { ...c, status: action === 'confirm' ? 'confirmed' : 'resolved' }
            : c
        ))
        message.success(action === 'confirm' ? '已确认逃费行为' : '案件已处理完成')
        setAuditModalVisible(false)
        form.resetFields()
      }
    })
  }

  const riskDistributionOption = {
    title: { text: '逃费风险分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item', formatter: '{b}: {c}辆 ({d}%)' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: 28, name: '高风险(>80分)', itemStyle: { color: '#f5222d' } },
          { value: 56, name: '中风险(60-80分)', itemStyle: { color: '#faad14' } },
          { value: 142, name: '低风险(<60分)', itemStyle: { color: '#52c41a' } },
        ]
      }
    ]
  }

  const evasionTypeOption = {
    title: { text: '逃费类型分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: ['倒卡逃费', '大车小标', 'U型行驶', '遮挡车牌', '跟车逃费', '其他']
    },
    series: [
      {
        type: 'bar',
        data: [45, 68, 52, 38, 25, 15],
        itemStyle: { color: '#722ed1' }
      }
    ]
  }

  const trendOption = {
    title: { text: '近30天稽查效率', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['稽查案件数', '破案数'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: { type: 'category', data: Array.from({ length: 30 }, (_, i) => `${i + 1}日`) },
    yAxis: { type: 'value' },
    series: [
      {
        name: '稽查案件数',
        type: 'line',
        smooth: true,
        data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 20 + 10)),
      },
      {
        name: '破案数',
        type: 'line',
        smooth: true,
        data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 15 + 5)),
      }
    ]
  }

  const columns = [
    {
      title: '车牌号',
      dataIndex: 'plateNumber',
      key: 'plateNumber',
      render: (t: string) => <span className="font-mono font-medium">{t}</span>
    },
    { title: '车型', dataIndex: 'vehicleType', key: 'vehicleType', render: (t: number) => `车型${t}` },
    {
      title: '风险评分',
      dataIndex: 'riskScore',
      key: 'riskScore',
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          strokeColor={getRiskColor(score)}
          format={() => score}
        />
      ),
      sorter: (a: EvasionCase, b: EvasionCase) => a.riskScore - b.riskScore
    },
    { title: '疑似类型', dataIndex: 'suspectedType', key: 'suspectedType' },
    { title: '首次发现', dataIndex: 'firstDetected', key: 'firstDetected' },
    { title: '最后出现', dataIndex: 'lastSeen', key: 'lastSeen' },
    { title: '预估损失', dataIndex: 'totalLoss', key: 'totalLoss', render: (v: number) => `¥${v.toLocaleString()}` },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: EvasionCase) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedCase(record); setDetailModalVisible(true) }}>
            详情
          </Button>
          {record.status !== 'resolved' && (
            <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => { setSelectedCase(record); setAuditModalVisible(true) }}>
              处理
            </Button>
          )}
        </Space>
      )
    }
  ]

  const highRiskVehicles = vehicleRecords.filter(v => v.evasionRisk > 70)

  const auditStrategies = [
    { title: '重点稽查大车小标车辆', desc: '通过门架称重数据与ETC标签车型对比，识别疑似大车小标车辆' },
    { title: '加强夜间稽查力度', desc: '夜间22:00-次日6:00是逃费高发时段，建议增加巡逻频次' },
    { title: '建立黑名单共享机制', desc: '跨省共享逃费车辆黑名单，实现全网联合稽查' },
    { title: 'AI视频分析辅助', desc: '利用AI视频分析技术自动识别遮挡车牌、跟车逃费等行为' },
  ]

  const investigatingCount = cases.filter(c => c.status === 'investigating').length
  const confirmedCount = cases.filter(c => c.status === 'confirmed').length
  const resolvedCount = cases.filter(c => c.status === 'resolved').length
  const totalLoss = cases.reduce((sum, c) => sum + c.totalLoss, 0)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">收费稽查</h1>
        <p className="text-gray-500 text-sm mt-1">逃费风险智能识别与稽查案件管理</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-error">
            <Statistic
              title={<span className="flex items-center gap-2"><AlertOutlined /> 稽查中案件</span>}
              value={investigatingCount}
              suffix="件"
              valueStyle={{ color: '#f5222d' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-warning">
            <Statistic
              title={<span className="flex items-center gap-2"><ThunderboltOutlined /> 已确认逃费</span>}
              value={confirmedCount}
              suffix="件"
              valueStyle={{ color: '#faad14' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-success">
            <Statistic
              title={<span className="flex items-center gap-2"><CheckOutlined /> 已处理案件</span>}
              value={resolvedCount}
              suffix="件"
              valueStyle={{ color: '#52c41a' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-primary">
            <Statistic
              title={<span className="flex items-center gap-2"><DollarOutlined /> 挽回损失</span>}
              value={totalLoss}
              suffix="元"
              valueStyle={{ color: '#1890ff' }}
              precision={0}
            />
          </div>
        </Col>
      </Row>

      <Tabs defaultActiveKey="cases">
        <TabPane tab="逃费案件" key="cases">
          <Card className="data-card">
            <Table
              columns={columns}
              dataSource={cases}
              rowKey="id"
              pagination={{ pageSize: 8 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="数据分析" key="analysis">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <Card className="data-card">
                <ReactECharts option={riskDistributionOption} style={{ height: 320 }} />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card className="data-card">
                <ReactECharts option={evasionTypeOption} style={{ height: 320 }} />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card className="data-card" title="稽查策略推荐">
                <List
                  dataSource={auditStrategies}
                  renderItem={(item) => (
                    <List.Item className="flex-col items-start px-0">
                      <p className="font-medium text-gray-800">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>

          <Card className="data-card mt-4">
            <ReactECharts option={trendOption} style={{ height: 350 }} />
          </Card>
        </TabPane>

        <TabPane tab="高风险车辆监控" key="highRisk">
          <Card className="data-card" title="实时高风险车辆列表">
            <Table
              columns={[
                { title: '车牌号', dataIndex: 'plateNumber', key: 'plateNumber', render: (t: string) => <span className="font-mono font-medium">{t}</span> },
                { title: '车型', dataIndex: 'vehicleType', key: 'vehicleType' },
                { title: '入口站', dataIndex: 'entryStation', key: 'entryStation' },
                { title: '出口站', dataIndex: 'exitStation', key: 'exitStation' },
                {
                  title: '超重',
                  dataIndex: 'overloaded',
                  key: 'overloaded',
                  render: (v: boolean) => v ? <Tag color="red">是</Tag> : <Tag color="green">否</Tag>
                },
                {
                  title: '逃费风险',
                  dataIndex: 'evasionRisk',
                  key: 'evasionRisk',
                  render: (score: number) => (
                    <Progress
                      percent={score}
                      size="small"
                      strokeColor={getRiskColor(score)}
                      format={() => score.toFixed(0)}
                    />
                  )
                }
              ]}
              dataSource={highRiskVehicles}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title="逃费案件详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={700}
        footer={
          <Space>
            {selectedCase && selectedCase.status !== 'resolved' && (
              <Button type="primary" icon={<CheckOutlined />} onClick={() => { setAuditModalVisible(true); setDetailModalVisible(false) }}>
                处理案件
              </Button>
            )}
            <Button onClick={() => setDetailModalVisible(false)}>关闭</Button>
          </Space>
        }
      >
        {selectedCase && (
          <div className="space-y-4">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="车牌号" span={1}>
                <span className="font-mono font-bold">{selectedCase.plateNumber}</span>
              </Descriptions.Item>
              <Descriptions.Item label="车型" span={1}>
                车型{selectedCase.vehicleType}
              </Descriptions.Item>
              <Descriptions.Item label="风险评分" span={1}>
                <Progress percent={selectedCase.riskScore} size="small" strokeColor={getRiskColor(selectedCase.riskScore)} />
              </Descriptions.Item>
              <Descriptions.Item label="状态" span={1}>
                <Tag color={getStatusColor(selectedCase.status)}>{getStatusText(selectedCase.status)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="疑似逃费类型" span={1}>
                {selectedCase.suspectedType}
              </Descriptions.Item>
              <Descriptions.Item label="预估损失金额" span={1}>
                <span className="text-red-500 font-medium">¥{selectedCase.totalLoss.toLocaleString()}</span>
              </Descriptions.Item>
              <Descriptions.Item label="首次发现时间" span={1}>
                {selectedCase.firstDetected}
              </Descriptions.Item>
              <Descriptions.Item label="最后出现时间" span={1}>
                {selectedCase.lastSeen}
              </Descriptions.Item>
            </Descriptions>

            <Card size="small" title="通行记录">
              <Table
                size="small"
                columns={[
                  { title: '时间', dataIndex: 'entryTime', key: 'entryTime' },
                  { title: '入口站', dataIndex: 'entryStation', key: 'entryStation' },
                  { title: '出口站', dataIndex: 'exitStation', key: 'exitStation' },
                  { title: '收费金额', dataIndex: 'toll', key: 'toll', render: (v: number) => `¥${v}` },
                ]}
                dataSource={vehicleRecords.filter(v => v.plateNumber === selectedCase.plateNumber)}
                rowKey="id"
                pagination={false}
              />
            </Card>
          </div>
        )}
      </Modal>

      <Modal
        title="处理逃费案件"
        open={auditModalVisible}
        onCancel={() => { setAuditModalVisible(false); form.resetFields() }}
        width={500}
        footer={null}
      >
        {selectedCase && (
          <Form form={form} layout="vertical">
            <div className="p-3 bg-orange-50 rounded-lg mb-4">
              <p className="font-medium">{selectedCase.plateNumber} - {selectedCase.suspectedType}</p>
              <p className="text-sm text-gray-500">预估损失：¥{selectedCase.totalLoss.toLocaleString()}</p>
            </div>

            <Form.Item
              name="result"
              label="处理结果"
              rules={[{ required: true }]}
            >
              <Select placeholder="请选择处理结果">
                <Option value="confirm">确认逃费，追缴通行费</Option>
                <Option value="warning">警告教育，记录在案</Option>
                <Option value="resolve">证据不足，结案处理</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="remark"
              label="处理备注"
              rules={[{ required: true }]}
            >
              <TextArea rows={4} placeholder="请输入处理备注..." />
            </Form.Item>

            <Form.Item className="mb-0">
              <Space className="w-full justify-end">
                <Button onClick={() => setAuditModalVisible(false)}>取消</Button>
                <Button type="primary" onClick={() => handleAudit('confirm')}>
                  确认处理
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}

export default TollAudit

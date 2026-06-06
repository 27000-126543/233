import { useState } from 'react'
import {
  Row,
  Col,
  Card,
  Upload,
  Button,
  Table,
  Tag,
  DatePicker,
  Form,
  Input,
  Select,
  Modal,
  Statistic,
  message,
  Space,
  List,
  Progress,
} from 'antd'
import {
  UploadOutlined,
  CalendarOutlined,
  FundProjectionScreenOutlined,
  DollarOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { RcFile } from 'antd/es/upload'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import { diversionStrategies } from '@/mock/data'
import { DiversionStrategy } from '@/types'
import type { HolidayPlan } from '@/types'

const { RangePicker } = DatePicker
const { Option } = Select

const HolidayPlan = () => {
  const [plans, setPlans] = useState<HolidayPlan[]>([
    {
      id: '1',
      name: '2024年端午节免费通行方案',
      startDate: '2024-06-10',
      endDate: '2024-06-12',
      vehicleTypes: [1, 2],
      freeToll: true,
    }
  ])
  const [selectedPlan, setSelectedPlan] = useState<HolidayPlan | null>(null)
  const [predictions, setPredictions] = useState<any[]>([])
  const [tollLoss, setTollLoss] = useState<any[]>([])
  const [strategyModalVisible, setStrategyModalVisible] = useState(false)
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [uploading, setUploading] = useState(false)

  const generatePredictionData = (plan: HolidayPlan) => {
    const data: any[] = []
    const start = dayjs(plan.startDate)
    for (let i = 0; i < 48; i++) {
      const time = start.add(i, 'hour')
      const hour = time.hour()
      let baseFlow = 15000
      if (hour >= 9 && hour <= 11) baseFlow = 22000
      else if (hour >= 14 && hour <= 16) baseFlow = 20000
      else if (hour >= 19 && hour <= 21) baseFlow = 21000
      else if (hour >= 0 && hour <= 5) baseFlow = 8000

      data.push({
        time: time.format('MM-DD HH:mm'),
        predictedFlow: baseFlow + Math.random() * 4000,
      })
    }
    return data
  }

  const generateTollLossData = (plan: HolidayPlan) => {
    const data: any[] = []
    const start = dayjs(plan.startDate)
    for (let i = 0; i < 48; i++) {
      const time = start.add(i, 'hour')
      const hour = time.hour()
      let baseLoss = 150000
      if (hour >= 9 && hour <= 11) baseLoss = 350000
      else if (hour >= 14 && hour <= 16) baseLoss = 280000
      else if (hour >= 19 && hour <= 21) baseLoss = 320000

      data.push({
        hour: time.format('HH:mm'),
        estimatedLoss: baseLoss + Math.random() * 50000,
      })
    }
    return data
  }

  const handleFileUpload = async (file: RcFile) => {
    setUploading(true)
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

      if (jsonData.length > 0) {
        const firstRow = jsonData[0]
        const newPlan: HolidayPlan = {
          id: String(Date.now()),
          name: firstRow['方案名称'] || firstRow['name'] || '导入的节假日方案',
          startDate: firstRow['开始日期'] || firstRow['startDate'] || dayjs().format('YYYY-MM-DD'),
          endDate: firstRow['结束日期'] || firstRow['endDate'] || dayjs().add(3, 'day').format('YYYY-MM-DD'),
          vehicleTypes: [1, 2],
          freeToll: true,
        }
        setPlans(prev => [...prev, newPlan])
        message.success('Excel文件解析成功，已导入方案')
      }
    } catch (error) {
      message.error('文件解析失败，请检查文件格式')
    }
    setUploading(false)
    return false
  }

  const handleViewPrediction = (plan: HolidayPlan) => {
    setSelectedPlan(plan)
    setPredictions(generatePredictionData(plan))
    setTollLoss(generateTollLossData(plan))
    setStrategyModalVisible(true)
  }

  const handleAddPlan = (values: any) => {
    const newPlan: HolidayPlan = {
      id: String(Date.now()),
      name: values.name,
      startDate: values.dateRange[0].format('YYYY-MM-DD'),
      endDate: values.dateRange[1].format('YYYY-MM-DD'),
      vehicleTypes: values.vehicleTypes,
      freeToll: true,
    }
    setPlans(prev => [...prev, newPlan])
    setAddModalVisible(false)
    form.resetFields()
    message.success('方案创建成功')
  }

  const predictionOption = {
    title: { text: '未来48小时流量预测', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['预测流量'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: predictions.map(d => d.time),
      axisLabel: { rotate: 45, fontSize: 10 }
    },
    yAxis: { type: 'value', name: '车流量' },
    series: [
      {
        name: '预测流量',
        type: 'line',
        smooth: true,
        data: predictions.map(d => d.predictedFlow),
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.5)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
            ]
          }
        },
        lineStyle: { color: '#1890ff', width: 2 },
        markPoint: {
          data: [
            { type: 'max', name: '峰值' },
          ]
        }
      }
    ]
  }

  const tollLossOption = {
    title: { text: '预计收费损失（按小时）', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => `${params[0].name}<br/>预计损失: ${(params[0].value / 10000).toFixed(1)}万元`
    },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: tollLoss.map(d => d.hour),
      axisLabel: { rotate: 45, fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      name: '金额(万元)',
      axisLabel: { formatter: (value: number) => (value / 10000).toFixed(0) }
    },
    series: [
      {
        type: 'bar',
        data: tollLoss.map(d => d.estimatedLoss),
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#fa8c16' },
              { offset: 1, color: '#ffa940' }
            ]
          }
        }
      }
    ]
  }

  const peakFlow = predictions.length > 0 ? Math.max(...predictions.map(d => d.predictedFlow)) : 0
  const totalLoss = tollLoss.reduce((sum, d) => sum + d.estimatedLoss, 0)

  const columns = [
    { title: '方案名称', dataIndex: 'name', key: 'name', render: (t: string) => <span className="font-medium">{t}</span> },
    { title: '开始日期', dataIndex: 'startDate', key: 'startDate' },
    { title: '结束日期', dataIndex: 'endDate', key: 'endDate' },
    {
      title: '免费车型',
      dataIndex: 'vehicleTypes',
      key: 'vehicleTypes',
      render: (types: number[]) => types.map(t => <Tag key={t}>车型{t}</Tag>)
    },
    {
      title: '状态',
      key: 'status',
      render: () => <Tag color="green"><CheckCircleOutlined /> 已启用</Tag>
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: HolidayPlan) => (
        <Button type="link" size="small" icon={<FundProjectionScreenOutlined />} onClick={() => handleViewPrediction(record)}>
          查看预测
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">节假日通行方案</h1>
          <p className="text-gray-500 text-sm mt-1">节假日免费通行方案管理与流量预测</p>
        </div>
        <Space>
          <Upload
            beforeUpload={handleFileUpload}
            showUploadList={false}
            accept=".xlsx,.xls"
          >
            <Button icon={<UploadOutlined />} loading={uploading}>
              导入Excel方案
            </Button>
          </Upload>
          <Button type="primary" icon={<CalendarOutlined />} onClick={() => setAddModalVisible(true)}>
            新建方案
          </Button>
        </Space>
      </div>

      <Card className="data-card" title="节假日方案列表">
        <Table
          columns={columns}
          dataSource={plans}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <FileExcelOutlined className="text-3xl text-blue-500" />
          <div>
            <h3 className="text-lg font-bold text-gray-800">Excel方案模板说明</h3>
            <p className="text-gray-500 text-sm">支持导入Excel格式的节假日免费通行方案，系统将自动提取时间窗口并生成预测</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-gray-600 font-medium mb-2">必填列</p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• 方案名称</li>
              <li>• 开始日期</li>
              <li>• 结束日期</li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-gray-600 font-medium mb-2">可选列</p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• 免费车型范围</li>
              <li>• 适用路段</li>
              <li>• 特殊说明</li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-gray-600 font-medium mb-2">系统自动分析</p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• 48小时流量峰值预测</li>
              <li>• 收费损失估算</li>
              <li>• 最优分流策略推荐</li>
            </ul>
          </div>
        </div>
      </div>

      <Modal
        title="新建节假日方案"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleAddPlan}>
          <Form.Item name="name" label="方案名称" rules={[{ required: true }]}>
            <Input placeholder="请输入方案名称，如：2024年国庆节免费通行方案" />
          </Form.Item>
          <Form.Item name="dateRange" label="免费时段" rules={[{ required: true }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="vehicleTypes" label="免费车型" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="请选择免费车型">
              <Option value={1}>车型1（客车一类）</Option>
              <Option value={2}>车型2（客车二类）</Option>
              <Option value={3}>车型3（货车一类）</Option>
              <Option value={4}>车型4（货车二类）</Option>
            </Select>
          </Form.Item>
          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setAddModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <FundProjectionScreenOutlined className="text-blue-500" />
            {selectedPlan?.name} - 流量预测与分流策略
          </div>
        }
        open={strategyModalVisible}
        onCancel={() => setStrategyModalVisible(false)}
        width={1200}
        footer={null}
      >
        {selectedPlan && (
          <div className="space-y-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card size="small">
                  <Statistic
                    title={<span className="flex items-center gap-1"><BarChartOutlined /> 预测峰值流量</span>}
                    value={peakFlow}
                    suffix="辆/小时"
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<ArrowUpOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card size="small">
                  <Statistic
                    title={<span className="flex items-center gap-1"><DollarOutlined /> 预计收费损失</span>}
                    value={totalLoss / 100000000}
                    precision={2}
                    suffix="亿元"
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card size="small">
                  <Statistic
                    title={<span className="flex items-center gap-1"><CalendarOutlined /> 免费时长</span>}
                    value={dayjs(selectedPlan.endDate).diff(dayjs(selectedPlan.startDate), 'day') + 1}
                    suffix="天"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card size="small">
                  <Statistic
                    title={<span className="flex items-center gap-1"><ThunderboltOutlined /> 高峰时段</span>}
                    value="9:00-11:00"
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={14}>
                <Card size="small">
                  <ReactECharts option={predictionOption} style={{ height: 300 }} />
                </Card>
              </Col>
              <Col xs={24} lg={10}>
                <Card size="small">
                  <ReactECharts option={tollLossOption} style={{ height: 300 }} />
                </Card>
              </Col>
            </Row>

            <Card size="small" title="推荐分流策略">
              <List
                dataSource={diversionStrategies}
                renderItem={(item: DiversionStrategy) => (
                  <List.Item className="flex-col items-start">
                    <div className="flex justify-between w-full mb-2">
                      <span className="font-medium text-blue-600">{item.name}</span>
                      <Tag color="green">推荐</Tag>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                    <div className="flex gap-4 w-full">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">预计流量减少</p>
                        <Progress percent={item.estimatedFlowReduction} size="small" status="active" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">实施成本</p>
                        <p className="font-medium">{(item.cost / 10000).toFixed(1)}万元</p>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default HolidayPlan

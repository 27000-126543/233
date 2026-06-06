import { useState, useEffect } from 'react'
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
  Alert,
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
  ReloadOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { EChartsOption } from 'echarts'
import { RcFile } from 'antd/es/upload'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import { diversionStrategies } from '@/mock/data'
import { DiversionStrategy } from '@/types'
import type { HolidayPlan } from '@/types'

const { RangePicker } = DatePicker
const { Option } = Select
const STORAGE_KEY = 'highway_holiday_plans'

const loadPlansFromStorage = (): HolidayPlan[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch (e) {
    console.error('加载方案失败', e)
  }
  return [
    {
      id: '1',
      name: '2024年端午节免费通行方案',
      startDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().add(4, 'day').format('YYYY-MM-DD'),
      vehicleTypes: [1, 2],
      freeToll: true,
    }
  ]
}

const savePlansToStorage = (plans: HolidayPlan[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans))
  } catch (e) {
    console.error('保存方案失败', e)
  }
}

const HolidayPlan = () => {
  const [plans, setPlans] = useState<HolidayPlan[]>(loadPlansFromStorage)
  const [selectedPlan, setSelectedPlan] = useState<HolidayPlan | null>(null)
  const [predictions, setPredictions] = useState<any[]>([])
  const [tollLoss, setTollLoss] = useState<any[]>([])
  const [strategyModalVisible, setStrategyModalVisible] = useState(false)
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [uploading, setUploading] = useState(false)
  const [_seed, setSeed] = useState(0)

  useEffect(() => {
    savePlansToStorage(plans)
  }, [plans])

  const seededRandom = (base: number, variance: number, s: number) => {
    const x = Math.sin(s) * 10000
    return base + (x - Math.floor(x)) * variance
  }

  const generatePredictionData = (plan: HolidayPlan, s: number = Date.now()) => {
    const data: any[] = []
    const start = dayjs(plan.startDate)
    const isWeekend = start.day() === 0 || start.day() === 6

    for (let i = 0; i < 48; i++) {
      const time = start.add(i, 'hour')
      const hour = time.hour()
      const dayOfHoliday = Math.floor(i / 24)

      let baseFlow = isWeekend ? 18000 : 15000

      if (dayOfHoliday === 0 && hour >= 9 && hour <= 12) {
        baseFlow = 32000 + (hour - 9) * 2000
      } else if (dayOfHoliday === 0 && hour >= 14 && hour <= 18) {
        baseFlow = 28000
      } else if (dayOfHoliday === 1 && hour >= 10 && hour <= 16) {
        baseFlow = 25000
      } else if (dayOfHoliday === 1 && hour >= 17 && hour <= 21) {
        baseFlow = 30000
      } else if (hour >= 0 && hour <= 5) {
        baseFlow = 7000
      } else if (hour >= 6 && hour <= 8) {
        baseFlow = 12000 + (hour - 6) * 3000
      } else if (hour >= 22 && hour <= 23) {
        baseFlow = 16000 - (hour - 22) * 3000
      }

      const flow = seededRandom(baseFlow, 5000, s + i * 137)

      data.push({
        time: time.format('MM-DD HH:mm'),
        predictedFlow: Math.round(flow),
      })
    }
    return data
  }

  const generateTollLossData = (plan: HolidayPlan, s: number = Date.now()) => {
    const data: any[] = []
    const start = dayjs(plan.startDate)
    const isWeekend = start.day() === 0 || start.day() === 6

    for (let i = 0; i < 48; i++) {
      const time = start.add(i, 'hour')
      const hour = time.hour()
      const dayOfHoliday = Math.floor(i / 24)

      let baseLoss = isWeekend ? 220000 : 180000

      if (dayOfHoliday === 0 && hour >= 9 && hour <= 12) {
        baseLoss = 520000 + (hour - 9) * 40000
      } else if (dayOfHoliday === 0 && hour >= 14 && hour <= 18) {
        baseLoss = 420000
      } else if (dayOfHoliday === 1 && hour >= 17 && hour <= 21) {
        baseLoss = 480000
      } else if (hour >= 0 && hour <= 5) {
        baseLoss = 80000
      }

      const loss = seededRandom(baseLoss, 60000, s + i * 251)

      data.push({
        hour: time.format('MM-DD HH:mm'),
        estimatedLoss: Math.round(loss),
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
        const importedPlans: HolidayPlan[] = jsonData.map((row, idx) => {
          const start = row['开始日期'] || row['startDate'] || dayjs().add(idx, 'day').format('YYYY-MM-DD')
          const end = row['结束日期'] || row['endDate'] || dayjs().add(idx + 2, 'day').format('YYYY-MM-DD')
          return {
            id: String(Date.now()) + idx,
            name: row['方案名称'] || row['name'] || `节假日方案 ${idx + 1}`,
            startDate: dayjs(start).isValid() ? dayjs(start).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
            endDate: dayjs(end).isValid() ? dayjs(end).format('YYYY-MM-DD') : dayjs().add(3, 'day').format('YYYY-MM-DD'),
            vehicleTypes: [1, 2],
            freeToll: true,
          }
        })
        setPlans(prev => [...prev, ...importedPlans])
        message.success(`成功导入 ${importedPlans.length} 个方案，点击查看预测生成动态数据`)
      }
    } catch (error) {
      message.error('文件解析失败，请检查文件格式')
    }
    setUploading(false)
    return false
  }

  const handleViewPrediction = (plan: HolidayPlan) => {
    setSelectedPlan(plan)
    const newSeed = Date.now()
    setSeed(newSeed)
    setPredictions(generatePredictionData(plan, newSeed))
    setTollLoss(generateTollLossData(plan, newSeed))
    setStrategyModalVisible(true)
  }

  const handleRefresh = () => {
    if (selectedPlan) {
      const newSeed = Date.now()
      setSeed(newSeed)
      setPredictions(generatePredictionData(selectedPlan, newSeed))
      setTollLoss(generateTollLossData(selectedPlan, newSeed))
      message.success('预测数据已刷新')
    }
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
    message.success('方案创建成功，点击查看预测生成动态数据')
  }

  const predictionOption: EChartsOption = {
    title: {
      text: selectedPlan
        ? `${selectedPlan.name} - 未来48小时流量预测 (${selectedPlan.startDate} ~ ${selectedPlan.endDate})`
        : '未来48小时流量预测',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0]
        return `时间: ${p.name}<br/>预测流量: ${p.value.toLocaleString()} 辆/小时`
      }
    },
    legend: { data: ['预测流量'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: predictions.map(d => d.time),
      axisLabel: { rotate: 45, fontSize: 9, interval: 3 }
    },
    yAxis: { type: 'value', name: '车流量(辆/小时)' },
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
            { type: 'max', name: '峰值', itemStyle: { color: '#f5222d' } },
          ]
        },
        markLine: {
          data: [{ type: 'average', name: '平均值' }]
        }
      }
    ]
  }

  const tollLossOption: EChartsOption = {
    title: { text: '预计收费损失（按小时）', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => `${params[0].name}<br/>预计损失: ${(params[0].value / 10000).toFixed(1)}万元`
    },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: tollLoss.map(d => d.hour),
      axisLabel: { rotate: 45, fontSize: 9, interval: 3 }
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
  const peakHour = predictions.length > 0
    ? predictions[predictions.findIndex(d => d.predictedFlow === peakFlow)]?.time
    : '-'

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
          <p className="text-gray-500 text-sm mt-1">节假日免费通行方案管理与流量预测（数据基于方案日期动态生成）</p>
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

      <Alert
        type="info"
        showIcon
        message="💡 数据说明"
        description="导入或新建方案后，点击『查看预测』将基于方案的开始日期动态生成未来48小时的流量预测曲线和收费损失条形图。每次打开都会基于当前时间重新计算，模拟真实的预测系统。"
      />

      <Card className="data-card" title="节假日方案列表（数据持久化到localStorage）">
        <Table
          columns={columns}
          dataSource={plans}
          rowKey="id"
          pagination={{ pageSize: 5 }}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FundProjectionScreenOutlined className="text-blue-500" />
              {selectedPlan?.name} - 流量预测与分流策略
            </div>
            <Button size="small" icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新预测
            </Button>
          </div>
        }
        open={strategyModalVisible}
        onCancel={() => setStrategyModalVisible(false)}
        width={1200}
        footer={null}
      >
        {selectedPlan && (
          <div className="space-y-4">
            <Alert
              type="success"
              showIcon
              message={`预测时间范围：${selectedPlan.startDate} 00:00 ~ ${dayjs(selectedPlan.startDate).add(2, 'day').format('YYYY-MM-DD')} 23:59（48小时）`}
              description="数据基于方案日期和历史节假日模式动态生成，模拟真实的交通流量预测系统"
            />

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
                    value={peakHour}
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

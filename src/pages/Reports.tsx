import { useState } from 'react'
import {
  Row,
  Col,
  Card,
  Table,
  Tag,
  Button,
  Statistic,
  Tabs,
  List,
  Progress,
  Descriptions,
  Space,
  Divider,
  Select,
} from 'antd'
import {
  FileTextOutlined,
  RiseOutlined,
  FallOutlined,
  CarOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DashboardOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { weeklyReports } from '@/mock/data'
import { WeeklyReport } from '@/types'

const { TabPane } = Tabs
const { Option } = Select

const Reports = () => {
  const [reports] = useState<WeeklyReport[]>(weeklyReports)
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(weeklyReports[0])
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('detail')

  const congestionTrendOption = {
    title: { text: '拥堵事件同比环比', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['本周', '上周', '去年同期'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
    yAxis: { type: 'value', name: '拥堵事件数' },
    series: [
      {
        name: '本周',
        type: 'bar',
        data: [18, 22, 25, 28, 35, 32, 18],
        itemStyle: { color: '#1890ff' }
      },
      {
        name: '上周',
        type: 'bar',
        data: [20, 24, 27, 30, 38, 34, 20],
        itemStyle: { color: '#52c41a' }
      },
      {
        name: '去年同期',
        type: 'bar',
        data: [25, 28, 32, 36, 42, 38, 25],
        itemStyle: { color: '#d9d9d9' }
      }
    ]
  }

  const flowTrendOption = {
    title: { text: '近8周车流量趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['车流量', '收费额'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: { type: 'category', data: ['第16周', '第17周', '第18周', '第19周', '第20周', '第21周', '第22周', '第23周'] },
    yAxis: [
      { type: 'value', name: '车流量(万)' },
      { type: 'value', name: '收费额(亿元)' }
    ],
    series: [
      {
        name: '车流量',
        type: 'line',
        smooth: true,
        data: [7856, 8023, 8256, 8123, 8456, 8623, 8756, 8956],
        areaStyle: { opacity: 0.3 }
      },
      {
        name: '收费额',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: [58.2, 59.8, 61.5, 60.8, 63.2, 64.8, 66.5, 68.5],
        lineStyle: { type: 'dashed' }
      }
    ]
  }

  const blackSpotColumns = [
    {
      title: '事故位置',
      dataIndex: 'location',
      key: 'location',
      render: (text: string) => (
        <span className="flex items-center gap-2">
          <EnvironmentOutlined className="text-red-500" />
          {text}
        </span>
      )
    },
    { title: '事故数量', dataIndex: 'accidentCount', key: 'accidentCount' },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => (
        <Tag color={severity === 'high' ? 'red' : severity === 'medium' ? 'orange' : 'green'}>
          {severity === 'high' ? '高' : severity === 'medium' ? '中' : '低'}
        </Tag>
      )
    },
    { title: '最近事故', dataIndex: 'lastAccident', key: 'lastAccident' }
  ]

  const reportColumns = [
    { title: '报告周期', dataIndex: 'week', key: 'week', render: (t: string) => <span className="font-medium">{t}</span> },
    { title: '开始日期', dataIndex: 'startDate', key: 'startDate' },
    { title: '结束日期', dataIndex: 'endDate', key: 'endDate' },
    { title: '总车流量', dataIndex: 'totalFlow', key: 'totalFlow', render: (v: number) => (v / 10000).toFixed(0) + '万辆' },
    { title: '总收费额', dataIndex: 'totalToll', key: 'totalToll', render: (v: number) => (v / 100000000).toFixed(2) + '亿元' },
    {
      title: '拥堵指数同比',
      dataIndex: 'congestionYoY',
      key: 'congestionYoY',
      render: (v: number) => (
        <span className={v < 0 ? 'text-green-500' : 'text-red-500'}>
          {v < 0 ? <ArrowDownOutlined /> : <ArrowUpOutlined />} {Math.abs(v)}%
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: WeeklyReport) => (
        <Space>
          <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => { setSelectedReport(record); setViewMode('detail') }}>
            查看详情
          </Button>
          <Button type="link" size="small" icon={<DownloadOutlined />}>
            下载PDF
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">运营报告</h1>
          <p className="text-gray-500 text-sm mt-1">每周路网运营健康报告与智能分析建议</p>
        </div>
        <Space>
          <Select defaultValue="week" style={{ width: 120 }}>
            <Option value="week">周报</Option>
            <Option value="month">月报</Option>
            <Option value="quarter">季报</Option>
          </Select>
          <Button icon={<DownloadOutlined />}>导出报告</Button>
        </Space>
      </div>

      <Tabs activeKey={viewMode} onChange={(key) => setViewMode(key as any)}>
        <TabPane tab="报告详情" key="detail">
          {selectedReport && (
            <div className="space-y-4">
              <Card className="data-card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <CalendarOutlined className="text-blue-500" />
                      {selectedReport.week} 路网运营健康报告
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                      统计周期：{selectedReport.startDate} 至 {selectedReport.endDate}
                    </p>
                  </div>
                  <Tag color="green" icon={<CheckCircleOutlined />}>已生成</Tag>
                </div>

                <Divider />

                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small" className="border-l-4 border-l-primary">
                      <Statistic
                        title={<span className="flex items-center gap-2"><CarOutlined /> 总车流量</span>}
                        value={selectedReport.totalFlow / 10000}
                        precision={0}
                        suffix="万辆"
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small" className="border-l-4 border-l-success">
                      <Statistic
                        title={<span className="flex items-center gap-2"><DollarOutlined /> 总收费额</span>}
                        value={selectedReport.totalToll / 100000000}
                        precision={2}
                        suffix="亿元"
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small" className="border-l-4 border-l-warning">
                      <Statistic
                        title={<span className="flex items-center gap-2"><DashboardOutlined /> 平均拥堵指数</span>}
                        value={selectedReport.avgCongestionIndex}
                        precision={2}
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small" className="border-l-4 border-l-purple-500">
                      <Statistic
                        title={<span className="flex items-center gap-2"><ThunderboltOutlined /> 稽查效率</span>}
                        value={selectedReport.auditEfficiency}
                        precision={1}
                        suffix="%"
                        valueStyle={{ color: '#722ed1' }}
                      />
                    </Card>
                  </Col>
                </Row>
              </Card>

              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card className="data-card" title="拥堵事件分析">
                    <Descriptions column={2} size="small">
                      <Descriptions.Item label="本周拥堵事件">
                        <span className="font-bold text-red-500">{selectedReport.congestionEvents} 起</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="事故黑点数量">
                        <span className="font-bold">{selectedReport.accidentBlackSpots.length} 处</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="同比变化">
                        <span className={selectedReport.congestionYoY < 0 ? 'text-green-500' : 'text-red-500'}>
                          {selectedReport.congestionYoY < 0 ? <FallOutlined /> : <RiseOutlined />}
                          {Math.abs(selectedReport.congestionYoY)}%
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="环比变化">
                        <span className={selectedReport.congestionQoQ < 0 ? 'text-green-500' : 'text-red-500'}>
                          {selectedReport.congestionQoQ < 0 ? <FallOutlined /> : <RiseOutlined />}
                          {Math.abs(selectedReport.congestionQoQ)}%
                        </span>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card className="data-card" title="关键指标趋势">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">车流量增长</span>
                          <span className="text-green-500">+8.2%</span>
                        </div>
                        <Progress percent={68} size="small" strokeColor="#52c41a" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">收费额增长</span>
                          <span className="text-green-500">+5.6%</span>
                        </div>
                        <Progress percent={58} size="small" strokeColor="#52c41a" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">拥堵指数下降</span>
                          <span className="text-green-500">-3.2%</span>
                        </div>
                        <Progress percent={42} size="small" strokeColor="#faad14" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">稽查效率提升</span>
                          <span className="text-green-500">+12.3%</span>
                        </div>
                        <Progress percent={85} size="small" strokeColor="#722ed1" />
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card className="data-card">
                    <ReactECharts option={congestionTrendOption} style={{ height: 320 }} />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card className="data-card">
                    <ReactECharts option={flowTrendOption} style={{ height: 320 }} />
                  </Card>
                </Col>
              </Row>

              <Card className="data-card" title="事故黑点分布">
                <Table
                  columns={blackSpotColumns}
                  dataSource={selectedReport.accidentBlackSpots}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </Card>

              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card className="data-card" title="养护计划建议" extra={<Tag color="blue">智能推荐</Tag>}>
                    <List
                      dataSource={selectedReport.maintenanceRecommendations}
                      renderItem={(item, index) => (
                        <List.Item className="px-0">
                          <List.Item.Meta
                            avatar={
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                {index + 1}
                              </div>
                            }
                            description={item}
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card className="data-card" title="收费稽查策略" extra={<Tag color="purple">AI生成</Tag>}>
                    <List
                      dataSource={selectedReport.auditStrategies}
                      renderItem={(item, index) => (
                        <List.Item className="px-0">
                          <List.Item.Meta
                            avatar={
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                                {index + 1}
                              </div>
                            }
                            description={item}
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </TabPane>

        <TabPane tab="报告列表" key="list">
          <Card className="data-card">
            <Table
              columns={reportColumns}
              dataSource={reports}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  )
}

export default Reports

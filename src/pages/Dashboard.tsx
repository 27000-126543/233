import { useState, useEffect } from 'react'
import {
  Row,
  Col,
  Card,
  Select,
  Table,
  Progress,
  Tag,
  Modal,
  Tabs,
  Statistic,
} from 'antd'
import {
  CarOutlined,
  RiseOutlined,
  DashboardOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useAuthStore } from '@/store/auth'
import {
  provinces,
  roadSegments,
  tollStations,
  generateTrafficFlowData,
  vehicleTypeDistribution,
} from '@/mock/data'
import { RoadSegment } from '@/types'
import dayjs from 'dayjs'

const { Option } = Select
const { TabPane } = Tabs

const Dashboard = () => {
  const user = useAuthStore((state) => state.user)
  const [selectedProvince, setSelectedProvince] = useState<string>('all')
  const [selectedSegment, setSelectedSegment] = useState<RoadSegment | null>(null)
  const [segmentModalVisible, setSegmentModalVisible] = useState(false)
  const [trafficFlowData, setTrafficFlowData] = useState(generateTrafficFlowData(7))

  useEffect(() => {
    const interval = setInterval(() => {
      setTrafficFlowData(prev => {
        const newData = [...prev.slice(1)]
        const now = dayjs()
        const hour = now.hour()
        const baseFlow = hour >= 7 && hour <= 9 ? 12000 : hour >= 17 && hour <= 19 ? 13000 : 8000
        newData.push({
          time: now.format('MM-DD HH:mm'),
          flow: baseFlow + Math.random() * 3000,
          avgSpeed: 60 + Math.random() * 40,
          congestionIndex: 0.2 + Math.random() * 0.5,
        })
        return newData
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const filteredSegments = selectedProvince === 'all'
    ? roadSegments
    : roadSegments.filter(s => s.province === selectedProvince)

  const filteredProvinces = selectedProvince === 'all'
    ? provinces
    : provinces.filter(p => p.name === selectedProvince)

  const totalFlow = filteredProvinces.reduce((sum, p) => sum + p.flow, 0)
  const totalToll = filteredProvinces.reduce((sum, p) => sum + p.toll, 0)
  const avgCongestion = filteredProvinces.reduce((sum, p) => sum + p.congestionIndex, 0) / filteredProvinces.length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'success'
      case 'warning': return 'warning'
      case 'congested': return 'error'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'normal': return '正常'
      case 'warning': return '预警'
      case 'congested': return '拥堵'
      default: return '未知'
    }
  }

  const heatmapOption = {
    title: {
      text: '全国路网车流量热力图',
      left: 'center',
      textStyle: { fontSize: 16 }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.name}<br/>车流量: ${(params.value / 10000).toFixed(1)}万辆`
      }
    },
    visualMap: {
      min: 3000000,
      max: 13000000,
      left: 'left',
      top: 'bottom',
      text: ['高', '低'],
      calculable: true,
      inRange: {
        color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695']
      }
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '15%'
    },
    xAxis: {
      type: 'category',
      data: provinces.map(p => p.name.substring(0, 2)),
      axisLabel: { rotate: 45 }
    },
    yAxis: {
      type: 'category',
      data: ['车流量']
    },
    series: [
      {
        name: '车流量',
        type: 'heatmap',
        data: provinces.map((p, i) => [i, 0, p.flow]),
        label: {
          show: true,
          formatter: (params: any) => (params.value[2] / 10000).toFixed(0) + '万',
          fontSize: 10
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  const flowTrendOption = {
    title: { text: selectedSegment ? `${selectedSegment.name} 近7天流量趋势` : '近7天交通流量趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['车流量', '平均车速', '拥堵指数'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trafficFlowData.map(d => d.time)
    },
    yAxis: [
      { type: 'value', name: '车流量', position: 'left' },
      { type: 'value', name: '车速(km/h)', position: 'right', max: 120 },
      { type: 'value', name: '拥堵指数', position: 'right', offset: 60, max: 1 }
    ],
    series: [
      {
        name: '车流量',
        type: 'line',
        smooth: true,
        data: trafficFlowData.map(d => d.flow),
        areaStyle: { opacity: 0.3 }
      },
      {
        name: '平均车速',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: trafficFlowData.map(d => d.avgSpeed)
      },
      {
        name: '拥堵指数',
        type: 'line',
        smooth: true,
        yAxisIndex: 2,
        data: trafficFlowData.map(d => d.congestionIndex),
        lineStyle: { type: 'dashed' }
      }
    ]
  }

  const vehicleTypeOption = {
    title: { text: '车型构成分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold' }
        },
        labelLine: { show: false },
        data: vehicleTypeDistribution.map(v => ({ value: v.count, name: v.type }))
      }
    ]
  }

  const provinceRankOption = {
    title: { text: '收费额排名 TOP 10', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        return `${params[0].name}<br/>收费额: ${(params[0].value / 100000000).toFixed(2)}亿元`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', axisLabel: { formatter: (value: number) => (value / 100000000).toFixed(0) + '亿' } },
    yAxis: { type: 'category', data: provinces.map(p => p.name).reverse() },
    series: [
      {
        type: 'bar',
        data: provinces.map(p => p.toll).reverse(),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#1890ff' },
              { offset: 1, color: '#69c0ff' }
            ]
          }
        }
      }
    ]
  }

  const segmentColumns = [
    {
      title: '路段名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-medium">{text}</span>
    },
    { title: '所属省份', dataIndex: 'province', key: 'province' },
    { title: '里程(km)', dataIndex: 'length', key: 'length', sorter: (a: RoadSegment, b: RoadSegment) => a.length - b.length },
    {
      title: '车流量',
      dataIndex: 'flow',
      key: 'flow',
      render: (value: number) => (value / 10000).toFixed(1) + '万',
      sorter: (a: RoadSegment, b: RoadSegment) => a.flow - b.flow
    },
    {
      title: '平均车速',
      dataIndex: 'avgSpeed',
      key: 'avgSpeed',
      render: (value: number) => `${value} km/h`,
      sorter: (a: RoadSegment, b: RoadSegment) => a.avgSpeed - b.avgSpeed
    },
    {
      title: '拥堵指数',
      dataIndex: 'congestionIndex',
      key: 'congestionIndex',
      render: (value: number) => (
        <Progress
          percent={value * 100}
          size="small"
          status={value > 0.7 ? 'exception' : value > 0.5 ? 'active' : 'normal'}
          format={() => value.toFixed(2)}
        />
      ),
      sorter: (a: RoadSegment, b: RoadSegment) => a.congestionIndex - b.congestionIndex
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: RoadSegment) => (
        <a onClick={() => { setSelectedSegment(record); setSegmentModalVisible(true) }}>
          查看详情
        </a>
      )
    }
  ]

  const stationColumns = [
    { title: '收费站名称', dataIndex: 'name', key: 'name' },
    { title: '车道数', dataIndex: 'lanes', key: 'lanes' },
    { title: '车流量', dataIndex: 'flow', key: 'flow', render: (v: number) => v.toLocaleString() },
    { title: '平均等待时间', dataIndex: 'avgWaitTime', key: 'avgWaitTime', render: (v: number) => `${v}秒` },
    {
      title: '通行效率',
      dataIndex: 'efficiency',
      key: 'efficiency',
      render: (value: number) => (
        <Progress
          percent={value}
          size="small"
          status={value < 70 ? 'exception' : 'normal'}
        />
      )
    },
    { title: '收费额(元)', dataIndex: 'toll', key: 'toll', render: (v: number) => v.toLocaleString() }
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">核心看板</h1>
          <p className="text-gray-500 text-sm mt-1">
            当前权限：{user?.role === 'national' ? '全网级' : user?.role === 'provincial' ? '省级' : '路段级'}
            {user?.province && ` · ${user.province}`}
          </p>
        </div>
        <div className="flex gap-3">
          <Select
            value={selectedProvince}
            onChange={setSelectedProvince}
            style={{ width: 160 }}
            placeholder="选择省份"
          >
            <Option value="all">全部省份</Option>
            {provinces.map(p => (
              <Option key={p.code} value={p.name}>{p.name}</Option>
            ))}
          </Select>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-primary">
            <Statistic
              title={
                <span className="flex items-center gap-2">
                  <CarOutlined /> 今日总车流量
                </span>
              }
              value={totalFlow}
              precision={0}
              suffix="辆"
              valueStyle={{ color: '#1890ff' }}
              prefix={<ArrowUpOutlined />}
            />
            <p className="text-gray-500 text-sm mt-2">较昨日 +5.2%</p>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-success">
            <Statistic
              title={
                <span className="flex items-center gap-2">
                  <DollarOutlined /> 今日收费总额
                </span>
              }
              value={totalToll}
              precision={0}
              suffix="元"
              valueStyle={{ color: '#52c41a' }}
              prefix={<ArrowUpOutlined />}
            />
            <p className="text-gray-500 text-sm mt-2">较昨日 +3.8%</p>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-warning">
            <Statistic
              title={
                <span className="flex items-center gap-2">
                  <DashboardOutlined /> 平均拥堵指数
                </span>
              }
              value={avgCongestion}
              precision={2}
              valueStyle={{ color: '#faad14' }}
              prefix={<ArrowDownOutlined />}
            />
            <p className="text-gray-500 text-sm mt-2">较昨日 -2.1%</p>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-error">
            <Statistic
              title={
                <span className="flex items-center gap-2">
                  <RiseOutlined /> 路段在线率
                </span>
              }
              value={98.6}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#f5222d' }}
            />
            <p className="text-gray-500 text-sm mt-2">2个路段设备告警</p>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card className="data-card">
            <ReactECharts option={heatmapOption} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="data-card">
            <ReactECharts option={provinceRankOption} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card className="data-card">
            <ReactECharts option={flowTrendOption} style={{ height: 400 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="data-card">
            <ReactECharts option={vehicleTypeOption} style={{ height: 400 }} />
          </Card>
        </Col>
      </Row>

      <Card className="data-card" title="路段运行状况">
        <Table
          columns={segmentColumns}
          dataSource={filteredSegments}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <EnvironmentOutlined className="text-blue-500" />
            {selectedSegment?.name} 详细信息
          </div>
        }
        open={segmentModalVisible}
        onCancel={() => setSegmentModalVisible(false)}
        width={1000}
        footer={null}
      >
        {selectedSegment && (
          <Tabs defaultActiveKey="overview">
            <TabPane tab="概览" key="overview">
              <Row gutter={[16, 16]} className="mb-4">
                <Col span={6}>
                  <Card size="small">
                    <Statistic title="车流量" value={selectedSegment.flow} suffix="辆" />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic title="平均车速" value={selectedSegment.avgSpeed} suffix="km/h" />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic title="拥堵指数" value={selectedSegment.congestionIndex} precision={2} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic title="今日收费" value={selectedSegment.toll} suffix="元" />
                  </Card>
                </Col>
              </Row>
              <ReactECharts option={flowTrendOption} style={{ height: 300 }} />
            </TabPane>
            <TabPane tab="收费站" key="stations">
              <Table
                columns={stationColumns}
                dataSource={tollStations.filter(s => s.segmentId === selectedSegment.id)}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </TabPane>
            <TabPane tab="车型分布" key="vehicleType">
              <ReactECharts option={vehicleTypeOption} style={{ height: 350 }} />
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  )
}

export default Dashboard

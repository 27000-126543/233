import { useState, useEffect, useMemo, useCallback } from 'react'
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
  Button,
  message,
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
import { EChartsOption } from 'echarts'
import { useAuthStore } from '@/store/auth'
import {
  provinces,
  roadSegments,
  tollStations,
  generateTrafficFlowData,
  vehicleTypeDistribution,
} from '@/mock/data'
import { RoadSegment, TrafficFlowData } from '@/types'
import dayjs from 'dayjs'

const { Option } = Select
const { TabPane } = Tabs

const Dashboard = () => {
  const user = useAuthStore((state) => state.user)
  const [selectedProvince, setSelectedProvince] = useState<string>('all')
  const [selectedSegment, setSelectedSegment] = useState<RoadSegment | null>(null)
  const [segmentModalVisible, setSegmentModalVisible] = useState(false)
  const [trafficFlowData, setTrafficFlowData] = useState<TrafficFlowData[]>([])
  const [liveSegments, setLiveSegments] = useState(roadSegments)
  const [liveProvinces, setLiveProvinces] = useState(provinces)

  useEffect(() => {
    setTrafficFlowData(generateTrafficFlowData(7))
  }, [selectedProvince, selectedSegment])

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveSegments(prev => prev.map(seg => {
        const flowDelta = (Math.random() - 0.5) * 2000
        const speedDelta = (Math.random() - 0.5) * 10
        const congestionDelta = (Math.random() - 0.5) * 0.05
        const newFlow = Math.max(1000, seg.flow + flowDelta)
        const newSpeed = Math.max(20, Math.min(120, seg.avgSpeed + speedDelta))
        const newCongestion = Math.max(0.1, Math.min(0.99, seg.congestionIndex + congestionDelta))
        let newStatus: 'normal' | 'warning' | 'congested' = 'normal'
        if (newCongestion > 0.8) newStatus = 'congested'
        else if (newCongestion > 0.5) newStatus = 'warning'
        return {
          ...seg,
          flow: Math.round(newFlow),
          avgSpeed: Math.round(newSpeed),
          congestionIndex: Number(newCongestion.toFixed(2)),
          status: newStatus,
        }
      }))

      setLiveProvinces(prev => prev.map(p => {
        const provinceSegments = liveSegments.filter(s => s.province === p.name)
        if (provinceSegments.length > 0) {
          const totalFlow = provinceSegments.reduce((sum, s) => sum + s.flow, 0)
          const avgCongestion = provinceSegments.reduce((sum, s) => sum + s.congestionIndex, 0) / provinceSegments.length
          return {
            ...p,
            flow: totalFlow * 100,
            congestionIndex: Number(avgCongestion.toFixed(2)),
            toll: Math.round(totalFlow * 70 * (1 + Math.random() * 0.1)),
          }
        }
        return p
      }))

      setTrafficFlowData(prev => {
        if (prev.length === 0) return prev
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

  const filteredSegments = useMemo(() => {
    return selectedProvince === 'all'
      ? liveSegments
      : liveSegments.filter(s => s.province === selectedProvince)
  }, [selectedProvince, liveSegments])

  const filteredProvinces = useMemo(() => {
    return selectedProvince === 'all'
      ? liveProvinces
      : liveProvinces.filter(p => p.name === selectedProvince)
  }, [selectedProvince, liveProvinces])

  const totalFlow = useMemo(() => filteredProvinces.reduce((sum, p) => sum + p.flow, 0), [filteredProvinces])
  const totalToll = useMemo(() => filteredProvinces.reduce((sum, p) => sum + p.toll, 0), [filteredProvinces])
  const avgCongestion = useMemo(() => filteredProvinces.length > 0
    ? filteredProvinces.reduce((sum, p) => sum + p.congestionIndex, 0) / filteredProvinces.length
    : 0, [filteredProvinces])

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

  const handleProvinceClick = useCallback((provinceName: string) => {
    setSelectedProvince(provinceName)
    message.info(`已筛选：${provinceName}的路段数据`)
  }, [])

  const provinceBarOption = useMemo<EChartsOption>(() => {
    const sortedProvinces = [...liveProvinces].sort((a, b) => b.flow - a.flow)
    return {
      title: {
        text: selectedProvince === 'all' ? '全国各省车流量分布' : `${selectedProvince} 车流量详情`,
        left: 'center',
        textStyle: { fontSize: 16 }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const p = params[0]
          const province = sortedProvinces.find(pr => pr.name === p.name)
          return `
            <strong>${p.name}</strong><br/>
            车流量: ${(p.value / 10000).toFixed(1)}万辆<br/>
            收费额: ${province ? (province.toll / 100000000).toFixed(2) + '亿元' : '-'}<br/>
            拥堵指数: ${province ? province.congestionIndex.toFixed(2) : '-'}
          `
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: sortedProvinces.map(p => p.name),
        axisLabel: { rotate: 45, fontSize: 11 }
      },
      yAxis: [
        { type: 'value', name: '车流量(万辆)', axisLabel: { formatter: (v: number) => (v / 10000).toFixed(0) } }
      ],
      series: [
        {
          name: '车流量',
          type: 'bar',
          data: sortedProvinces.map(p => ({
            value: p.flow,
            itemStyle: {
              color: p.congestionIndex > 0.6
                ? '#f5222d'
                : p.congestionIndex > 0.4
                  ? '#faad14'
                  : '#52c41a'
            }
          })),
          label: {
            show: true,
            position: 'top',
            formatter: (params: any) => (params.value / 10000).toFixed(0) + '万',
            fontSize: 10
          },
          barWidth: '60%',
        }
      ]
    }
  }, [liveProvinces, selectedProvince])

  const onChartClick = useCallback((params: any) => {
    console.log('Chart clicked:', params)
    const provinceName = params.name || params.data?.name
    if (provinceName && liveProvinces.some(p => p.name === provinceName)) {
      handleProvinceClick(provinceName)
    }
  }, [liveProvinces, handleProvinceClick])

  const tollRankOption = useMemo<EChartsOption>(() => {
    const displayProvinces = selectedProvince === 'all'
      ? [...liveProvinces].sort((a, b) => b.toll - a.toll)
      : liveProvinces.filter(p => p.name === selectedProvince)

    return {
      title: {
        text: selectedProvince === 'all' ? '收费额排名 TOP 10' : `${selectedProvince} 收费详情`,
        left: 'center',
        textStyle: { fontSize: 14 }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          return `${params[0].name}<br/>收费额: ${(params[0].value / 100000000).toFixed(2)}亿元`
        }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: { formatter: (value: number) => (value / 100000000).toFixed(0) + '亿' }
      },
      yAxis: { type: 'category', data: displayProvinces.map(p => p.name).reverse() },
      series: [
        {
          type: 'bar',
          data: displayProvinces.map(p => p.toll).reverse(),
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#1890ff' },
                { offset: 1, color: '#69c0ff' }
              ]
            }
          },
          label: {
            show: true,
            position: 'right',
            formatter: (params: any) => (params.value / 100000000).toFixed(1) + '亿',
            fontSize: 10
          }
        }
      ]
    }
  }, [liveProvinces, selectedProvince])

  const flowTrendOption = useMemo<EChartsOption>(() => ({
    title: {
      text: selectedSegment
        ? `${selectedSegment.name} 近7天流量趋势`
        : selectedProvince !== 'all'
          ? `${selectedProvince} 近7天流量趋势`
          : '全国路网近7天交通流量趋势',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
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
  }), [trafficFlowData, selectedSegment, selectedProvince])

  const vehicleTypeOption = useMemo<EChartsOption>(() => ({
    title: { text: '车型构成分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left', top: 'center' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: vehicleTypeDistribution.map(v => ({ value: v.count, name: v.type }))
      }
    ]
  }), [])

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
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
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
        <Progress percent={value} size="small" status={value < 70 ? 'exception' : 'normal'} />
      )
    },
    { title: '收费额(元)', dataIndex: 'toll', key: 'toll', render: (v: number) => v.toLocaleString() }
  ]

  const events = useMemo(() => ({
    click: onChartClick
  }), [onChartClick])

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
            style={{ width: 180 }}
            placeholder="选择省份"
            size="large"
          >
            <Option value="all">全部省份（点击柱形图下钻）</Option>
            {liveProvinces.map(p => (
              <Option key={p.code} value={p.name}>{p.name}</Option>
            ))}
          </Select>
          {selectedProvince !== 'all' && (
            <Button onClick={() => setSelectedProvince('all')}>返回全国</Button>
          )}
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-primary">
            <Statistic
              title={<span className="flex items-center gap-2"><CarOutlined /> 今日总车流量</span>}
              value={totalFlow}
              precision={0}
              suffix="辆"
              valueStyle={{ color: '#1890ff' }}
              prefix={<ArrowUpOutlined />}
            />
            <p className="text-gray-500 text-sm mt-2">较昨日 +{(5 + Math.random() * 2).toFixed(1)}%</p>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-success">
            <Statistic
              title={<span className="flex items-center gap-2"><DollarOutlined /> 今日收费总额</span>}
              value={totalToll}
              precision={0}
              suffix="元"
              valueStyle={{ color: '#52c41a' }}
              prefix={<ArrowUpOutlined />}
            />
            <p className="text-gray-500 text-sm mt-2">较昨日 +{(3 + Math.random() * 2).toFixed(1)}%</p>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-warning">
            <Statistic
              title={<span className="flex items-center gap-2"><DashboardOutlined /> 平均拥堵指数</span>}
              value={avgCongestion}
              precision={2}
              valueStyle={{ color: '#faad14' }}
              prefix={<ArrowDownOutlined />}
            />
            <p className="text-gray-500 text-sm mt-2">较昨日 -{(2 + Math.random() * 1).toFixed(1)}%</p>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-error">
            <Statistic
              title={<span className="flex items-center gap-2"><RiseOutlined /> 路段在线率</span>}
              value={98 + Math.random()}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#f5222d' }}
            />
            <p className="text-gray-500 text-sm mt-2">{liveSegments.filter(s => s.status !== 'normal').length}个路段告警</p>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            className="data-card"
            extra={
              <span className="text-xs text-gray-500">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>正常
                <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mx-1 ml-3"></span>预警
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full mx-1 ml-3"></span>拥堵
              </span>
            }
          >
            <ReactECharts
              option={provinceBarOption}
              style={{ height: 350, cursor: 'pointer' }}
              onEvents={events}
            />
            <p className="text-center text-gray-400 text-xs mt-2">
              💡 点击省份柱形可下钻查看该省详细路段数据
            </p>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="data-card">
            <ReactECharts option={tollRankOption} style={{ height: 350 }} />
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

      <Card
        className="data-card"
        title={
          <span>
            路段运行状况
            {selectedProvince !== 'all' && (
              <Tag color="blue" className="ml-2">{selectedProvince}</Tag>
            )}
          </span>
        }
      >
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

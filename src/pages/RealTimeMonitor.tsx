import { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Progress, List, Badge, Statistic } from 'antd'
import {
  DatabaseOutlined,
  CarOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  DashboardOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { dataSources, vehicleRecords, roadSegments, generateTrafficFlowData } from '@/mock/data'
import { DataSource, VehicleRecord } from '@/types'
import dayjs from 'dayjs'

const RealTimeMonitor = () => {
  const [dataSourceList, setDataSourceList] = useState<DataSource[]>(dataSources)
  const [vehicleList] = useState<VehicleRecord[]>(vehicleRecords)
  const [trafficData, setTrafficData] = useState(generateTrafficFlowData(1))

  useEffect(() => {
    const interval = setInterval(() => {
      setDataSourceList(prev => prev.map(ds => ({
        ...ds,
        recordsPerSecond: ds.recordsPerSecond + Math.floor((Math.random() - 0.5) * 1000),
        lastUpdate: dayjs().format('YYYY-MM-DD HH:mm:ss')
      })))

      setTrafficData(prev => {
        const newData = [...prev.slice(1)]
        const now = dayjs()
        const hour = now.hour()
        const baseFlow = hour >= 7 && hour <= 9 ? 12000 : hour >= 17 && hour <= 19 ? 13000 : 8000
        newData.push({
          time: now.format('HH:mm:ss'),
          flow: baseFlow + Math.random() * 3000,
          avgSpeed: 60 + Math.random() * 40,
          congestionIndex: 0.2 + Math.random() * 0.5,
        })
        return newData
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const getDataSourceIcon = (type: string) => {
    switch (type) {
      case 'etc': return <DatabaseOutlined />
      case 'gantry': return <SwapOutlined />
      case 'weight': return <ThunderboltOutlined />
      case 'video': return <DashboardOutlined />
      default: return <DatabaseOutlined />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online': return <Badge status="success" text="正常" />
      case 'warning': return <Badge status="warning" text="告警" />
      case 'offline': return <Badge status="error" text="离线" />
      default: return <Badge status="default" text="未知" />
    }
  }

  const realTimeFlowOption = {
    title: { text: '实时交通流量监测', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['车流量', '拥堵指数'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trafficData.map(d => d.time)
    },
    yAxis: [
      { type: 'value', name: '车流量' },
      { type: 'value', name: '拥堵指数', max: 1 }
    ],
    series: [
      {
        name: '车流量',
        type: 'line',
        smooth: true,
        data: trafficData.map(d => d.flow),
        areaStyle: { opacity: 0.3 },
        lineStyle: { width: 2 }
      },
      {
        name: '拥堵指数',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: trafficData.map(d => d.congestionIndex),
        lineStyle: { type: 'dashed', color: '#faad14' }
      }
    ]
  }

  const speedDistributionOption = {
    title: { text: '平均车速分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: roadSegments.map(s => s.name.substring(0, 8)) },
    yAxis: { type: 'value', name: 'km/h', max: 120 },
    series: [
      {
        type: 'bar',
        data: roadSegments.map(s => s.avgSpeed),
        itemStyle: {
          color: (params: any) => {
            if (params.value < 60) return '#f5222d'
            if (params.value < 80) return '#faad14'
            return '#52c41a'
          }
        },
        label: { show: true, position: 'top' }
      }
    ]
  }

  const dataSourceColumns = [
    {
      title: '数据源',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: DataSource) => (
        <div className="flex items-center gap-2">
          <span className="text-blue-500">{getDataSourceIcon(record.type)}</span>
          <span className="font-medium">{text}</span>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusBadge(status)
    },
    {
      title: '数据速率',
      dataIndex: 'recordsPerSecond',
      key: 'recordsPerSecond',
      render: (value: number) => `${value.toLocaleString()} 条/秒`
    },
    { title: '最后更新', dataIndex: 'lastUpdate', key: 'lastUpdate' }
  ]

  const vehicleColumns = [
    { title: '车牌号', dataIndex: 'plateNumber', key: 'plateNumber', render: (t: string) => <span className="font-mono font-medium">{t}</span> },
    { title: '车型', dataIndex: 'vehicleType', key: 'vehicleType', render: (t: number) => `车型${t}` },
    { title: '入口站', dataIndex: 'entryStation', key: 'entryStation' },
    { title: '出口站', dataIndex: 'exitStation', key: 'exitStation' },
    { title: '入场时间', dataIndex: 'entryTime', key: 'entryTime' },
    {
      title: 'ETC交易',
      dataIndex: 'etcTransaction',
      key: 'etcTransaction',
      render: (value: boolean) => value ? <CheckCircleOutlined className="text-green-500" /> : <CloseCircleOutlined className="text-gray-400" />
    },
    {
      title: '超重',
      dataIndex: 'overloaded',
      key: 'overloaded',
      render: (value: boolean) => value ? <ExclamationCircleOutlined className="text-orange-500" /> : <CheckCircleOutlined className="text-green-500" />
    },
    {
      title: '逃费风险',
      dataIndex: 'evasionRisk',
      key: 'evasionRisk',
      render: (value: number) => (
        <Progress
          percent={value}
          size="small"
          status={value > 80 ? 'exception' : value > 50 ? 'active' : 'normal'}
          format={() => value.toFixed(0)}
        />
      )
    }
  ]

  const totalRecordsPerSecond = dataSourceList.reduce((sum, ds) => sum + ds.recordsPerSecond, 0)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">实时监测</h1>
        <p className="text-gray-500 text-sm mt-1">多源数据流实时接入与车辆通行档案监控</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-primary">
            <Statistic
              title={<span className="flex items-center gap-2"><DatabaseOutlined /> 接入数据源</span>}
              value={dataSourceList.length}
              suffix="个"
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="mt-2 flex gap-2">
              {dataSourceList.filter(ds => ds.status === 'online').length} 个在线
              <span className="text-gray-300">|</span>
              {dataSourceList.filter(ds => ds.status === 'warning').length} 个告警
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-success">
            <Statistic
              title={<span className="flex items-center gap-2"><ThunderboltOutlined /> 数据处理速率</span>}
              value={totalRecordsPerSecond}
              suffix="条/秒"
              valueStyle={{ color: '#52c41a' }}
              precision={0}
            />
            <p className="text-gray-500 text-sm mt-2">实时清洗与合并处理中</p>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-warning">
            <Statistic
              title={<span className="flex items-center gap-2"><CarOutlined /> 今日通行车辆</span>}
              value={128564}
              suffix="辆"
              valueStyle={{ color: '#faad14' }}
              precision={0}
            />
            <p className="text-gray-500 text-sm mt-2">已生成统一通行档案</p>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-error">
            <Statistic
              title={<span className="flex items-center gap-2"><ExclamationCircleOutlined /> 高风险车辆</span>}
              value={vehicleList.filter(v => v.evasionRisk > 80).length}
              suffix="辆"
              valueStyle={{ color: '#f5222d' }}
            />
            <p className="text-gray-500 text-sm mt-2">逃费风险评分&gt;80分</p>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card className="data-card">
            <ReactECharts option={realTimeFlowOption} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="data-card" title="数据源状态">
            <List
              dataSource={dataSourceList}
              renderItem={(item) => (
                <List.Item className="px-0">
                  <List.Item.Meta
                    avatar={<span className="text-2xl">{getDataSourceIcon(item.type)}</span>}
                    title={
                      <div className="flex items-center justify-between">
                        <span>{item.name}</span>
                        {getStatusBadge(item.status)}
                      </div>
                    }
                    description={
                      <div>
                        <span className="text-gray-600">{item.recordsPerSecond.toLocaleString()} 条/秒</span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="text-gray-400 text-xs">{item.lastUpdate}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card className="data-card">
            <ReactECharts option={speedDistributionOption} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card className="data-card" title="数据源接入详情">
            <Table
              columns={dataSourceColumns}
              dataSource={dataSourceList}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Card className="data-card" title="实时车辆通行记录">
        <Table
          columns={vehicleColumns}
          dataSource={vehicleList}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          size="small"
        />
      </Card>
    </div>
  )
}

export default RealTimeMonitor

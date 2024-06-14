import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

function toThousands(num: any) {
  return num?.toString().replace(/\d+/, function (n: any) {
    return n.replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');
  });
}

function numberFormat(num: number) {
  return num < 1000 ? toThousands(num) : toThousands((num / 1000).toFixed(1)) + 'k';
}

export default function LineEcharts(props: any) {
  const { height = 200, opt, id } = props;

  const PieChartRef = useRef<HTMLDivElement>(null);

  const color = ['rgba(82, 133, 255, 1)', 'rgba(255, 207, 47, 1)'];

  const areaColor = ['rgba(82, 133, 255, 0.2)', 'rgba(255, 207, 47, 0.2)'];

  function initChart() {
    let myChart = echarts?.getInstanceByDom(document.getElementById(id)!);
    if (myChart === null || myChart === undefined) {
      myChart = echarts.init(document.getElementById(id)!);
    }
    const series: any = [];
    if (opt?.yData?.length) {
      opt?.yData.forEach((item: any, index: number) => {
        series.push({
          itemStyle: {
            color: color[index]
          },
          areaStyle: item.area
            ? {
                color: areaColor[index]
              }
            : null,
          ...item
        });
      });
    }
    const option = {
      title: {
        text: opt?.title,
        textStyle: {
          fontSize: '16px'
        }
      },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: any) => numberFormat(value)
        // axisPointer: {
        //   type: 'cross',
        //   label: {
        //     backgroundColor: '#6a7985'
        //   }
        // }
      },
      legend: {
        right: 0,
        itemWidth: 8,
        textStyle: {
          color: '#646A73'
        },
        icon: 'circle'
      },
      grid: {
        left: '1%',
        right: '1%',
        bottom: '0',
        top: '18%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: opt.xData
      },
      yAxis: {
        type: 'value',
        splitLine: {
          lineStyle: {
            color: '#EFF0F1'
          }
        },
        axisLabel: {
          formatter: (value: any) => {
            return numberFormat(value);
          }
        }
      },
      series: series
    };

    // 渲染数据
    myChart.setOption(option, true);
  }

  function changeChartSize() {
    echarts?.getInstanceByDom(document.getElementById(id)!)?.resize();
  }

  useEffect(() => {
    initChart();
    window.addEventListener('resize', changeChartSize);
    return () => {
      // echarts && echarts?.getInstanceByDom(document.getElementById(id)!)?.dispose();
      window.removeEventListener('resize', changeChartSize);
    };
  });

  return <div id={id} ref={PieChartRef} style={{ height: height, width: '100%' }}></div>;
}

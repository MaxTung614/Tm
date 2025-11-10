"""
抓包数据分析示例
演示如何使用CaptureAnalyzer分析您提供的抓包数据
"""

import sys
from pathlib import Path

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from TSDK.tools.capture_analyzer import CaptureAnalyzer
from loguru import logger


def example_analyze_html():
    """示例：分析HTML页面"""
    analyzer = CaptureAnalyzer()
    
    # 方式1: 从文件加载
    # analyzer.load_html_file('path/to/gift_page.html', name='礼享金兑换页面')
    
    # 方式2: 直接传入HTML内容
    html_content = """
    <!-- 在这里粘贴完整的HTML代码 -->
    """
    
    result = analyzer.load_html_content(html_content, name='礼享金兑换页面')
    
    logger.info(f"提取到的JSON数据: {len(result['json_data'])} 个")
    logger.info(f"提取到的脚本: {len(result['scripts'])} 个")
    
    return analyzer


def example_analyze_request():
    """示例：分析API请求"""
    analyzer = CaptureAnalyzer()
    
    # 方式1: 使用URL和参数
    url = "https://h5api.m.taobao.com/h5/mtop.xxx.xxx/1.0/?appKey=12574478&t=1234567890&sign=xxxx"
    headers = {
        'User-Agent': 'Mozilla/5.0...',
        'Cookie': 'cookie2=xxx; _m_h5_tk=xxx',
        'Content-Type': 'application/json'
    }
    
    analyzer.analyze_request(
        url=url,
        method='POST',
        headers=headers,
        data={'itemId': '12345'},
        name='礼享金兑换接口'
    )
    
    # 方式2: 使用cURL命令
    curl_command = """
    curl 'https://h5api.m.taobao.com/h5/mtop.xxx.xxx/1.0/' \
      -H 'User-Agent: Mozilla/5.0...' \
      -H 'Cookie: cookie2=xxx' \
      --data-raw '{"itemId":"12345"}'
    """
    
    analyzer.analyze_curl(curl_command, name='cURL导入示例')
    
    return analyzer


def example_analyze_response():
    """示例：分析API响应"""
    analyzer = CaptureAnalyzer()
    
    response_text = """
    {
        "ret": ["SUCCESS::调用成功"],
        "data": {
            "success": true,
            "orderId": "123456789"
        },
        "api": "mtop.xxx.xxx",
        "v": "1.0"
    }
    """
    
    result = analyzer.analyze_response(response_text, name='兑换响应')
    
    logger.info(f"响应成功: {result['success']}")
    logger.info(f"响应数据: {result['data']}")
    
    return analyzer


def example_batch_analyze():
    """示例：批量分析抓包数据"""
    analyzer = CaptureAnalyzer()
    
    # 准备批量数据
    capture_data = [
        {
            'type': 'html',
            'name': '礼享金页面',
            'content': '<html>...</html>'  # 粘贴完整HTML
        },
        {
            'type': 'request',
            'name': '查询库存',
            'url': 'https://h5api.m.taobao.com/h5/mtop.xxx/1.0/?...',
            'method': 'GET',
            'headers': {'Cookie': 'xxx'}
        },
        {
            'type': 'response',
            'name': '库存响应',
            'content': '{"ret":["SUCCESS"],"data":{...}}'
        },
        {
            'type': 'curl',
            'name': '兑换请求',
            'content': "curl 'https://...' -H '...'"
        }
    ]
    
    # 批量分析
    summary = analyzer.load_capture_batch(capture_data)
    
    logger.info(f"分析完成: {summary}")
    
    # 生成报告
    report = analyzer.generate_report()
    print(report)
    
    # 导出结果
    analyzer.export_results('my_capture_analysis.json')
    
    # 生成API函数
    functions = analyzer.generate_api_functions()
    for func in functions:
        print(func)
    
    return analyzer


def main():
    """主函数"""
    logger.info("=" * 80)
    logger.info("欢迎使用抓包数据分析工具")
    logger.info("=" * 80)
    logger.info("")
    logger.info("请选择分析模式：")
    logger.info("1. 分析HTML页面")
    logger.info("2. 分析API请求")
    logger.info("3. 分析API响应")
    logger.info("4. 批量分析（推荐）")
    logger.info("")
    
    # 这里可以根据需要调用不同的示例函数
    # analyzer = example_analyze_html()
    # analyzer = example_analyze_request()
    # analyzer = example_analyze_response()
    analyzer = example_batch_analyze()
    
    # 获取摘要
    summary = analyzer.get_summary()
    logger.success(f"分析摘要: {summary}")


if __name__ == '__main__':
    main()

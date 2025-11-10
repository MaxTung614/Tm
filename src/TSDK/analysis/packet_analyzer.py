"""
抓包数据分析工具
用于分析淘宝/天猫的网络请求，提取关键信息
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime
import json
import re
from pathlib import Path
from loguru import logger


@dataclass
class RequestInfo:
    """请求信息"""
    method: str
    url: str
    headers: Dict[str, str]
    params: Optional[Dict[str, Any]] = None
    data: Optional[Dict[str, Any]] = None
    cookies: Optional[Dict[str, str]] = None


@dataclass
class ResponseInfo:
    """响应信息"""
    status_code: int
    headers: Dict[str, str]
    body: str
    cookies: Optional[Dict[str, str]] = None


@dataclass
class PacketInfo:
    """完整的请求-响应包信息"""
    name: str
    request: RequestInfo
    response: ResponseInfo
    timestamp: datetime
    notes: str = ""


class PacketAnalyzer:
    """抓包数据分析器"""
    
    def __init__(self, save_dir: str = "analysis/packets"):
        self.save_dir = Path(save_dir)
        self.save_dir.mkdir(parents=True, exist_ok=True)
        self.packets: List[PacketInfo] = []
        
    def add_packet_from_json(self, packet_json: str) -> PacketInfo:
        """
        从 JSON 格式添加抓包数据
        
        示例格式：
        {
            "name": "登录二维码生成",
            "request": {
                "method": "GET",
                "url": "https://...",
                "headers": {...},
                "params": {...}
            },
            "response": {
                "status_code": 200,
                "headers": {...},
                "body": "..."
            }
        }
        """
        data = json.loads(packet_json)
        
        request = RequestInfo(
            method=data['request']['method'],
            url=data['request']['url'],
            headers=data['request'].get('headers', {}),
            params=data['request'].get('params'),
            data=data['request'].get('data'),
            cookies=data['request'].get('cookies')
        )
        
        response = ResponseInfo(
            status_code=data['response']['status_code'],
            headers=data['response'].get('headers', {}),
            body=data['response'].get('body', ''),
            cookies=data['response'].get('cookies')
        )
        
        packet = PacketInfo(
            name=data.get('name', 'Unknown'),
            request=request,
            response=response,
            timestamp=datetime.now(),
            notes=data.get('notes', '')
        )
        
        self.packets.append(packet)
        return packet
    
    def add_packet_from_curl(self, curl_command: str, name: str = "curl_request") -> RequestInfo:
        """从 curl 命令解析请求"""
        # 提取 URL
        url_match = re.search(r"curl\s+'([^']+)'", curl_command)
        url = url_match.group(1) if url_match else ""
        
        # 提取 headers
        headers = {}
        for match in re.finditer(r"-H\s+'([^:]+):\s*([^']+)'", curl_command):
            headers[match.group(1)] = match.group(2)
        
        # 提取 method
        method = "GET"
        if "-X POST" in curl_command or "--data" in curl_command:
            method = "POST"
        
        # 提取 data
        data = None
        data_match = re.search(r"--data\s+'([^']+)'", curl_command)
        if data_match:
            try:
                data = json.loads(data_match.group(1))
            except:
                data = {"raw": data_match.group(1)}
        
        request = RequestInfo(
            method=method,
            url=url,
            headers=headers,
            data=data
        )
        
        logger.info(f"解析 curl 命令：{name}")
        return request
    
    def extract_sign_algorithm(self, request: RequestInfo) -> Dict[str, Any]:
        """
        分析签名算法
        淘宝 H5 API 的签名格式：sign = md5(token + "&" + timestamp + "&" + appKey + "&" + data)
        """
        url = request.url
        params = request.params or {}
        
        result = {
            "sign": params.get('sign', ''),
            "t": params.get('t', ''),
            "appKey": params.get('appKey', ''),
            "data": params.get('data', ''),
            "token_hint": "需要从 Cookie 中的 _m_h5_tk 提取前32位"
        }
        
        # 检查是否为标准的 mtop 请求
        if 'h5api.m.taobao.com' in url and '/h5/mtop.' in url:
            result['api_type'] = 'mtop'
            result['api_name'] = re.search(r'/h5/(mtop\.[^/]+)', url).group(1) if re.search(r'/h5/(mtop\.[^/]+)', url) else ''
        
        return result
    
    def extract_cookies(self, response: ResponseInfo) -> Dict[str, Any]:
        """提取响应中的重要 Cookie"""
        cookies = response.cookies or {}
        set_cookie_headers = response.headers.get('Set-Cookie', '')
        
        important_cookies = {
            '_m_h5_tk': '',
            '_m_h5_tk_enc': '',
            'cookie2': '',
            '_tb_token_': '',
            'unb': '',
            'cna': '',
            'isg': '',
        }
        
        # 从 Set-Cookie 中提取
        for cookie_str in set_cookie_headers.split(','):
            for key in important_cookies.keys():
                if key in cookie_str:
                    match = re.search(f'{key}=([^;]+)', cookie_str)
                    if match:
                        important_cookies[key] = match.group(1)
        
        return important_cookies
    
    def analyze_api_structure(self, request: RequestInfo) -> Dict[str, Any]:
        """分析 API 结构"""
        from urllib.parse import urlparse, parse_qs
        
        parsed = urlparse(request.url)
        query = parse_qs(parsed.query)
        
        structure = {
            "domain": parsed.netloc,
            "path": parsed.path,
            "api_name": "",
            "version": "",
            "params": {},
        }
        
        # 提取 API 名称和版本
        path_match = re.search(r'/h5/(mtop\.[^/]+)/([^/]+)', parsed.path)
        if path_match:
            structure['api_name'] = path_match.group(1)
            structure['version'] = path_match.group(2)
        
        # 提取参数
        for key, value in query.items():
            structure['params'][key] = value[0] if len(value) == 1 else value
        
        return structure
    
    def generate_python_code(self, packet: PacketInfo) -> str:
        """根据抓包数据生成 Python 代码"""
        api_struct = self.analyze_api_structure(packet.request)
        func_name = self._generate_func_name(api_struct['api_name'])
        
        code = f'''
def {func_name}(self, data: Dict[str, Any] = {{}}) -> Dict[str, Any]:
    """
    {packet.name}
    API: {api_struct['api_name']}
    Version: {api_struct['version']}
    """
    method = "{packet.request.method}"
    url = "{packet.request.url.split('?')[0]}"
    
    params = {{
        'jsv': '{api_struct['params'].get('jsv', '2.6.1')}',
        'appKey': '{api_struct['params'].get('appKey', '12574478')}',
        't': str(int(time.time() * 1000)),
        'api': '{api_struct['api_name']}',
        'v': '{api_struct['version']}',
        'type': '{api_struct['params'].get('type', 'originaljson')}',
        'dataType': '{api_struct['params'].get('dataType', 'json')}',
    }}
    
    # 合并用户传入的 data
    if data:
        params['data'] = json.dumps(data)
    else:
        params['data'] = '{api_struct['params'].get('data', '{}')}'
    
    # 计算签名
    params['sign'] = self._calculate_sign(params)
    
    response = self.get(url, params=params)
    return response.json()
'''
        return code
    
    def _generate_func_name(self, api_name: str) -> str:
        """将 API 名称转换为函数名"""
        # mtop.taobao.detail.getdetail -> MtopTaobaoDetailGetdetail
        parts = api_name.split('.')
        func_name = ''.join(word.capitalize() for word in parts)
        return func_name
    
    def save_analysis_report(self, filename: str = "analysis_report.md"):
        """保存分析报告"""
        report = f"# 抓包数据分析报告\n\n"
        report += f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        report += f"总计抓包数量: {len(self.packets)}\n\n"
        
        for i, packet in enumerate(self.packets, 1):
            report += f"## {i}. {packet.name}\n\n"
            report += f"**时间**: {packet.timestamp.strftime('%Y-%m-%d %H:%M:%S')}\n\n"
            report += f"**请求**: {packet.request.method} {packet.request.url}\n\n"
            
            # API 结构
            api_struct = self.analyze_api_structure(packet.request)
            report += f"**API**: {api_struct['api_name']} v{api_struct['version']}\n\n"
            
            # 请求头
            report += "**请求头**:\n```json\n"
            report += json.dumps(packet.request.headers, indent=2, ensure_ascii=False)
            report += "\n```\n\n"
            
            # 响应
            report += f"**响应状态**: {packet.response.status_code}\n\n"
            
            # 签名分析
            sign_info = self.extract_sign_algorithm(packet.request)
            if sign_info['sign']:
                report += "**签名信息**:\n```json\n"
                report += json.dumps(sign_info, indent=2, ensure_ascii=False)
                report += "\n```\n\n"
            
            # 生成的代码
            report += "**生成的 Python 代码**:\n```python\n"
            report += self.generate_python_code(packet)
            report += "\n```\n\n"
            
            report += "---\n\n"
        
        # 保存报告
        report_path = self.save_dir / filename
        report_path.write_text(report, encoding='utf-8')
        logger.info(f"分析报告已保存到: {report_path}")
        
        return report
    
    def export_to_json(self, filename: str = "packets.json"):
        """导出为 JSON 格式"""
        data = []
        for packet in self.packets:
            data.append({
                'name': packet.name,
                'timestamp': packet.timestamp.isoformat(),
                'request': {
                    'method': packet.request.method,
                    'url': packet.request.url,
                    'headers': packet.request.headers,
                    'params': packet.request.params,
                    'data': packet.request.data,
                },
                'response': {
                    'status_code': packet.response.status_code,
                    'headers': packet.response.headers,
                    'body': packet.response.body,
                }
            })
        
        export_path = self.save_dir / filename
        export_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding='utf-8')
        logger.info(f"数据已导出到: {export_path}")


if __name__ == "__main__":
    # 示例用法
    analyzer = PacketAnalyzer()
    
    # 示例：添加一个抓包数据
    sample_packet = '''
    {
        "name": "获取商品详情",
        "request": {
            "method": "GET",
            "url": "https://h5api.m.taobao.com/h5/mtop.taobao.detail.getdetail/6.0/",
            "headers": {
                "User-Agent": "Mozilla/5.0...",
                "Cookie": "_m_h5_tk=xxx"
            },
            "params": {
                "jsv": "2.6.1",
                "appKey": "12574478",
                "t": "1234567890",
                "sign": "xxx",
                "api": "mtop.taobao.detail.getdetail",
                "v": "6.0",
                "data": "{\\"itemNumId\\":\\"123456\\"}"
            }
        },
        "response": {
            "status_code": 200,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": "{\\"ret\\":[\\"SUCCESS::调用成功\\"]}"
        }
    }
    '''
    
    packet = analyzer.add_packet_from_json(sample_packet)
    print(f"添加抓包: {packet.name}")
    
    # 生成分析报告
    analyzer.save_analysis_report()

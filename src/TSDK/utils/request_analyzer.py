"""
请求分析工具
用于分析抓包数据、解析请求头、响应数据等
"""

import json
import re
from typing import Dict, Any, Optional, List
from urllib.parse import urlparse, parse_qs, parse_qsl, unquote
from loguru import logger


class RequestAnalyzer:
    """HTTP请求分析器"""
    
    @staticmethod
    def parse_curl(curl_command: str) -> Dict[str, Any]:
        """
        解析cURL命令
        
        Args:
            curl_command: cURL命令字符串
            
        Returns:
            包含URL、headers、data等信息的字典
        """
        result = {
            'url': '',
            'method': 'GET',
            'headers': {},
            'data': None,
            'params': {}
        }
        
        # 提取URL
        url_match = re.search(r"curl\s+'([^']+)'|curl\s+\"([^\"]+)\"|curl\s+([^\s]+)", curl_command)
        if url_match:
            result['url'] = url_match.group(1) or url_match.group(2) or url_match.group(3)
        
        # 提取请求方法
        method_match = re.search(r"-X\s+(\w+)", curl_command)
        if method_match:
            result['method'] = method_match.group(1)
        
        # 提取headers
        header_matches = re.finditer(r"-H\s+'([^:]+):\s*([^']+)'|-H\s+\"([^:]+):\s*([^\"]+)\"", curl_command)
        for match in header_matches:
            key = match.group(1) or match.group(3)
            value = match.group(2) or match.group(4)
            result['headers'][key] = value
        
        # 提取data
        data_match = re.search(r"--data-raw\s+'([^']+)'|--data-raw\s+\"([^\"]+)\"|--data\s+'([^']+)'|--data\s+\"([^\"]+)\"", curl_command)
        if data_match:
            data_str = data_match.group(1) or data_match.group(2) or data_match.group(3) or data_match.group(4)
            try:
                result['data'] = json.loads(data_str)
            except:
                result['data'] = data_str
        
        return result
    
    @staticmethod
    def parse_headers(headers_text: str) -> Dict[str, str]:
        """
        解析请求头文本
        
        Args:
            headers_text: 请求头文本，每行一个header
            
        Returns:
            headers字典
        """
        headers = {}
        for line in headers_text.strip().split('\n'):
            line = line.strip()
            if ':' in line:
                key, value = line.split(':', 1)
                headers[key.strip()] = value.strip()
        return headers
    
    @staticmethod
    def parse_url(url: str) -> Dict[str, Any]:
        """
        解析URL，提取各个组成部分
        
        Args:
            url: 完整的URL
            
        Returns:
            包含scheme、hostname、path、params等信息的字典
        """
        parsed = urlparse(url)
        
        return {
            'url': url,
            'scheme': parsed.scheme,
            'hostname': parsed.hostname,
            'port': parsed.port,
            'path': parsed.path,
            'params': dict(parse_qsl(parsed.query)),
            'fragment': parsed.fragment
        }
    
    @staticmethod
    def extract_sign_params(url: str) -> Dict[str, Any]:
        """
        提取淘宝API签名参数
        
        Args:
            url: 淘宝API URL
            
        Returns:
            包含appKey、t、sign、api、v、data等参数的字典
        """
        parsed = RequestAnalyzer.parse_url(url)
        params = parsed['params']
        
        # 提取关键参数
        sign_params = {
            'appKey': params.get('appKey', ''),
            't': params.get('t', ''),
            'sign': params.get('sign', ''),
            'api': params.get('api', ''),
            'v': params.get('v', ''),
            'data': params.get('data', ''),
            'jsv': params.get('jsv', ''),
            'type': params.get('type', 'json'),
            'dataType': params.get('dataType', 'json')
        }
        
        # 尝试解析data参数（通常是JSON字符串）
        if sign_params['data']:
            try:
                sign_params['data_parsed'] = json.loads(unquote(sign_params['data']))
            except:
                sign_params['data_parsed'] = sign_params['data']
        
        return sign_params
    
    @staticmethod
    def analyze_response(response_text: str) -> Dict[str, Any]:
        """
        分析API响应数据
        
        Args:
            response_text: 响应文本
            
        Returns:
            解析后的响应数据
        """
        result = {
            'raw': response_text,
            'parsed': None,
            'success': False,
            'ret': [],
            'data': None,
            'error': None
        }
        
        try:
            # 尝试解析JSON
            data = json.loads(response_text)
            result['parsed'] = data
            
            # 淘宝API通用响应格式
            if 'ret' in data:
                result['ret'] = data['ret']
                result['success'] = 'SUCCESS::' in str(data['ret'])
            
            if 'data' in data:
                result['data'] = data['data']
            
            # 检查错误信息
            if 'api' in data:
                result['api'] = data['api']
            if 'v' in data:
                result['v'] = data['v']
            
        except json.JSONDecodeError as e:
            result['error'] = f"JSON解析失败: {e}"
            logger.error(result['error'])
        
        return result
    
    @staticmethod
    def extract_html_data(html: str, selector_type: str = 'json') -> List[Any]:
        """
        从HTML中提取数据
        
        Args:
            html: HTML内容
            selector_type: 提取类型 (json|script|meta)
            
        Returns:
            提取的数据列表
        """
        results = []
        
        if selector_type == 'json':
            # 提取JSON数据（通常在<script>标签中）
            json_patterns = [
                r'<script[^>]*>\s*window\.__INITIAL_DATA__\s*=\s*({.*?})\s*</script>',
                r'<script[^>]*>\s*var\s+g_config\s*=\s*({.*?})\s*</script>',
                r'<script[^>]*>\s*({.*?})\s*</script>'
            ]
            
            for pattern in json_patterns:
                matches = re.finditer(pattern, html, re.DOTALL)
                for match in matches:
                    try:
                        data = json.loads(match.group(1))
                        results.append(data)
                    except:
                        pass
        
        elif selector_type == 'script':
            # 提取所有script标签内容
            script_pattern = r'<script[^>]*>(.*?)</script>'
            matches = re.finditer(script_pattern, html, re.DOTALL)
            results = [match.group(1) for match in matches]
        
        elif selector_type == 'meta':
            # 提取meta标签
            meta_pattern = r'<meta\s+([^>]+)>'
            matches = re.finditer(meta_pattern, html)
            for match in matches:
                attrs = {}
                attr_pattern = r'(\w+)=["\']([^"\']+)["\']'
                for attr_match in re.finditer(attr_pattern, match.group(1)):
                    attrs[attr_match.group(1)] = attr_match.group(2)
                results.append(attrs)
        
        return results
    
    @staticmethod
    def generate_function_template(api_name: str, url: str, method: str = 'GET') -> str:
        """
        根据API信息生成函数模板
        
        Args:
            api_name: API名称
            url: API URL
            method: 请求方法
            
        Returns:
            生成的函���代码模板
        """
        parsed = RequestAnalyzer.parse_url(url)
        sign_params = RequestAnalyzer.extract_sign_params(url)
        
        # 生成函数名（驼峰命名）
        func_name_parts = api_name.replace('.', '_').split('_')
        func_name = ''.join([part.capitalize() for part in func_name_parts])
        
        template = f'''
    def {func_name}(self, data: Dict[str, Any] = {{}}) -> Optional[Dict[str, Any]]:
        """
        {api_name}
        
        Args:
            data: 请求参数
            
        Returns:
            API响应数据
        """
        api = "{sign_params['api']}"
        version = "{sign_params['v']}"
        
        # 合并默认参数和自定义参数
        request_data = {{}}
        request_data.update(data)
        
        return self._execute_mtop_request(
            api=api,
            version=version,
            data=request_data,
            method="{method}"
        )
'''
        
        return template
    
    @staticmethod
    def save_analysis_report(data: Dict[str, Any], filename: str = "analysis_report.json"):
        """
        保存分析报告
        
        Args:
            data: 分析数据
            filename: 文件名
        """
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            logger.info(f"分析报告已保存到: {filename}")
        except Exception as e:
            logger.error(f"保存分析报告失败: {e}")

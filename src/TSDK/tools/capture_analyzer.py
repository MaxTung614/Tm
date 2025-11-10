"""
抓包数据分析工具
用于处理和分析您提供的抓包数据
"""

import json
from typing import Dict, Any, List, Optional
from pathlib import Path
from loguru import logger
from ..utils.request_analyzer import RequestAnalyzer


class CaptureAnalyzer:
    """抓包数据分析器"""
    
    def __init__(self, output_dir: str = "data/analysis"):
        """
        初始化分析器
        
        Args:
            output_dir: 分析结果输出目录
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.analyzer = RequestAnalyzer()
        
        # 存储分析结果
        self.analysis_results = {
            'html_data': {},
            'api_requests': [],
            'headers': {},
            'responses': [],
            'signatures': []
        }
    
    def load_html_file(self, filepath: str, name: str = "gift_page") -> Dict[str, Any]:
        """
        加载并分析HTML文件
        
        Args:
            filepath: HTML文件路径
            name: 页面名称
            
        Returns:
            分析结果
        """
        logger.info(f"加载HTML文件: {filepath}")
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                html = f.read()
            
            result = {
                'name': name,
                'size': len(html),
                'json_data': self.analyzer.extract_html_data(html, 'json'),
                'scripts': self.analyzer.extract_html_data(html, 'script'),
                'meta_tags': self.analyzer.extract_html_data(html, 'meta')
            }
            
            self.analysis_results['html_data'][name] = result
            logger.success(f"HTML分析完成: {name}")
            
            return result
            
        except Exception as e:
            logger.error(f"加载HTML文件失败: {e}")
            return {}
    
    def load_html_content(self, html: str, name: str = "page") -> Dict[str, Any]:
        """
        直接分析HTML内容
        
        Args:
            html: HTML内容
            name: 页面名称
            
        Returns:
            分析结果
        """
        logger.info(f"分析HTML内容: {name}")
        
        result = {
            'name': name,
            'size': len(html),
            'json_data': self.analyzer.extract_html_data(html, 'json'),
            'scripts': self.analyzer.extract_html_data(html, 'script')[:5],  # 只保留前5个script
            'meta_tags': self.analyzer.extract_html_data(html, 'meta')
        }
        
        self.analysis_results['html_data'][name] = result
        return result
    
    def analyze_request(self, url: str, method: str = "GET", 
                       headers: Optional[Dict[str, str]] = None,
                       data: Optional[Any] = None,
                       name: str = "") -> Dict[str, Any]:
        """
        分析单个请求
        
        Args:
            url: 请求URL
            method: 请求方法
            headers: 请求头
            data: 请求数据
            name: 请求名称
            
        Returns:
            分析结果
        """
        logger.info(f"分析请求: {name or url}")
        
        result = {
            'name': name,
            'url_info': self.analyzer.parse_url(url),
            'sign_params': self.analyzer.extract_sign_params(url),
            'method': method,
            'headers': headers or {},
            'data': data
        }
        
        self.analysis_results['api_requests'].append(result)
        return result
    
    def analyze_curl(self, curl_command: str, name: str = "") -> Dict[str, Any]:
        """
        分析cURL命令
        
        Args:
            curl_command: cURL命令
            name: 请求名称
            
        Returns:
            分析结果
        """
        logger.info(f"分析cURL命令: {name}")
        
        parsed = self.analyzer.parse_curl(curl_command)
        
        result = {
            'name': name,
            'parsed': parsed,
            'url_info': self.analyzer.parse_url(parsed['url']),
            'sign_params': self.analyzer.extract_sign_params(parsed['url'])
        }
        
        self.analysis_results['api_requests'].append(result)
        return result
    
    def analyze_response(self, response_text: str, name: str = "") -> Dict[str, Any]:
        """
        分析API响应
        
        Args:
            response_text: 响应文本
            name: 响应名称
            
        Returns:
            分析结果
        """
        logger.info(f"分析响应: {name}")
        
        result = self.analyzer.analyze_response(response_text)
        result['name'] = name
        
        self.analysis_results['responses'].append(result)
        return result
    
    def load_capture_batch(self, data_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        批量加载抓包数据
        
        Args:
            data_list: 数据列表，每项包含type、content等字段
            
        Returns:
            汇总分析结果
        """
        logger.info(f"批量加载 {len(data_list)} 条抓包数据")
        
        summary = {
            'total': len(data_list),
            'html_count': 0,
            'request_count': 0,
            'response_count': 0
        }
        
        for idx, item in enumerate(data_list, 1):
            item_type = item.get('type', 'unknown')
            name = item.get('name', f'{item_type}_{idx}')
            
            if item_type == 'html':
                self.load_html_content(item['content'], name)
                summary['html_count'] += 1
                
            elif item_type == 'request':
                self.analyze_request(
                    url=item.get('url', ''),
                    method=item.get('method', 'GET'),
                    headers=item.get('headers'),
                    data=item.get('data'),
                    name=name
                )
                summary['request_count'] += 1
                
            elif item_type == 'response':
                self.analyze_response(item['content'], name)
                summary['response_count'] += 1
                
            elif item_type == 'curl':
                self.analyze_curl(item['content'], name)
                summary['request_count'] += 1
        
        logger.success(f"批量分析完成: {summary}")
        return summary
    
    def generate_api_functions(self) -> List[str]:
        """
        根据分析结果生成API函数模板
        
        Returns:
            函数代码列表
        """
        functions = []
        
        for request in self.analysis_results['api_requests']:
            sign_params = request.get('sign_params', {})
            api_name = sign_params.get('api', '')
            
            if api_name:
                url = request['url_info']['url']
                method = request.get('method', 'GET')
                
                func_code = self.analyzer.generate_function_template(
                    api_name=api_name,
                    url=url,
                    method=method
                )
                functions.append(func_code)
        
        return functions
    
    def export_results(self, filename: str = "capture_analysis.json") -> str:
        """
        导出分析结果
        
        Args:
            filename: 文件名
            
        Returns:
            文件路径
        """
        output_file = self.output_dir / filename
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(self.analysis_results, f, ensure_ascii=False, indent=2)
            
            logger.success(f"分析结果已导出: {output_file}")
            return str(output_file)
            
        except Exception as e:
            logger.error(f"导出结果失败: {e}")
            return ""
    
    def generate_report(self) -> str:
        """
        生成分析报告
        
        Returns:
            报告文本
        """
        report_lines = [
            "=" * 80,
            "抓包数据分析报告",
            "=" * 80,
            "",
            f"HTML页面数: {len(self.analysis_results['html_data'])}",
            f"API请求数: {len(self.analysis_results['api_requests'])}",
            f"响应数据数: {len(self.analysis_results['responses'])}",
            "",
            "-" * 80,
            "API列表:",
            "-" * 80
        ]
        
        for idx, request in enumerate(self.analysis_results['api_requests'], 1):
            sign_params = request.get('sign_params', {})
            api_name = sign_params.get('api', 'unknown')
            version = sign_params.get('v', '')
            
            report_lines.append(f"{idx}. {api_name} (v{version})")
            report_lines.append(f"   URL: {request['url_info']['url'][:100]}...")
            report_lines.append("")
        
        report = "\n".join(report_lines)
        
        # 保存报告
        report_file = self.output_dir / "analysis_report.txt"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report)
        
        logger.info(f"分析报告已生成: {report_file}")
        
        return report
    
    def get_summary(self) -> Dict[str, Any]:
        """
        获取分析摘要
        
        Returns:
            摘要信息
        """
        return {
            'html_pages': list(self.analysis_results['html_data'].keys()),
            'api_count': len(self.analysis_results['api_requests']),
            'response_count': len(self.analysis_results['responses']),
            'unique_apis': list(set([
                r.get('sign_params', {}).get('api', '')
                for r in self.analysis_results['api_requests']
                if r.get('sign_params', {}).get('api')
            ]))
        }

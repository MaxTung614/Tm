"""
P0功能测试
测试Cookie管理、请求分析等核心功能
"""

import pytest
import sys
from pathlib import Path

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from TSDK.utils.cookie_manager import CookieManager
from TSDK.utils.request_analyzer import RequestAnalyzer
from TSDK.api.taobao.gift import TmallGiftAPI
from TSDK.tools.capture_analyzer import CaptureAnalyzer
from datetime import datetime


class TestCookieManager:
    """测试Cookie管理器"""
    
    def test_save_and_load_cookies(self, tmp_path):
        """测试Cookie的保存和加载"""
        manager = CookieManager(storage_dir=str(tmp_path / "cookies"), encrypt=False)
        
        # 保存Cookie
        test_cookies = {
            'cookie2': 'test_cookie2_value',
            '_m_h5_tk': 'test_token_12345678901234567890',
            '_tb_token_': 'test_tb_token'
        }
        
        assert manager.save_cookies('test_user', test_cookies)
        
        # 加载Cookie
        loaded_data = manager.load_cookies('test_user')
        assert loaded_data is not None
        assert loaded_data['cookies'] == test_cookies
    
    def test_encrypted_cookies(self, tmp_path):
        """测试加密Cookie存储"""
        manager = CookieManager(storage_dir=str(tmp_path / "cookies_enc"), encrypt=True)
        
        test_cookies = {'test_key': 'test_value'}
        
        assert manager.save_cookies('encrypted_user', test_cookies)
        loaded_data = manager.load_cookies('encrypted_user')
        
        assert loaded_data is not None
        assert loaded_data['cookies'] == test_cookies
    
    def test_cookie_validity(self, tmp_path):
        """测试Cookie有效期检查"""
        manager = CookieManager(storage_dir=str(tmp_path / "cookies"), encrypt=False)
        
        manager.save_cookies('user1', {'key': 'value'})
        
        # 刚保存的Cookie应该是有效的
        assert manager.is_cookie_valid('user1', max_age_hours=24)
    
    def test_export_cookie_string(self, tmp_path):
        """测试导出Cookie字符串"""
        manager = CookieManager(storage_dir=str(tmp_path / "cookies"), encrypt=False)
        
        test_cookies = {
            'cookie2': 'value1',
            '_m_h5_tk': 'value2'
        }
        
        manager.save_cookies('user1', test_cookies)
        cookie_str = manager.export_cookie_string('user1')
        
        assert cookie_str is not None
        assert 'cookie2=value1' in cookie_str
        assert '_m_h5_tk=value2' in cookie_str


class TestRequestAnalyzer:
    """测试请求分析器"""
    
    def test_parse_url(self):
        """测试URL解析"""
        url = "https://h5api.m.taobao.com/h5/mtop.test.api/1.0/?appKey=12574478&t=1234567890&sign=abcdef"
        
        result = RequestAnalyzer.parse_url(url)
        
        assert result['scheme'] == 'https'
        assert result['hostname'] == 'h5api.m.taobao.com'
        assert result['path'] == '/h5/mtop.test.api/1.0/'
        assert result['params']['appKey'] == '12574478'
    
    def test_extract_sign_params(self):
        """测试提取签名参数"""
        url = "https://h5api.m.taobao.com/h5/mtop.taobao.gift.exchange/1.0/?appKey=12574478&t=1234567890&sign=abc&api=mtop.taobao.gift.exchange&v=1.0&data=%7B%22itemId%22%3A%2212345%22%7D"
        
        params = RequestAnalyzer.extract_sign_params(url)
        
        assert params['appKey'] == '12574478'
        assert params['api'] == 'mtop.taobao.gift.exchange'
        assert params['v'] == '1.0'
        assert 'data_parsed' in params
    
    def test_analyze_response(self):
        """测试响应分析"""
        response_text = '''
        {
            "ret": ["SUCCESS::调用成功"],
            "data": {"orderId": "123456"},
            "api": "mtop.test.api",
            "v": "1.0"
        }
        '''
        
        result = RequestAnalyzer.analyze_response(response_text)
        
        assert result['success'] == True
        assert result['data']['orderId'] == '123456'
        assert result['api'] == 'mtop.test.api'
    
    def test_parse_curl(self):
        """测试cURL解析"""
        curl = """curl 'https://h5api.m.taobao.com/h5/test' -H 'Cookie: test=value' --data-raw '{"key":"value"}'"""
        
        result = RequestAnalyzer.parse_curl(curl)
        
        assert 'https://h5api.m.taobao.com/h5/test' in result['url']
        assert 'Cookie' in result['headers']


class TestTmallGiftAPI:
    """测试礼享金API"""
    
    def test_api_initialization(self):
        """测试API初始化"""
        gift_api = TmallGiftAPI()
        
        assert gift_api.gift_api_base == 'https://h5api.m.tmall.com/h5'
        assert gift_api.appKey == '12574478'
        assert gift_api.jsv == '2.6.1'
    
    def test_get_user_balance(self):
        """测试获取用户余额"""
        gift_api = TmallGiftAPI()
        
        # 这个测试需要实际的Cookie才能运行
        # 这里只测试方法存在性
        assert hasattr(gift_api, 'get_user_balance')
        assert callable(gift_api.get_user_balance)


class TestCaptureAnalyzer:
    """测试抓包分析器"""
    
    def test_analyze_request(self, tmp_path):
        """测试请求分析"""
        analyzer = CaptureAnalyzer(output_dir=str(tmp_path / "analysis"))
        
        url = "https://h5api.m.taobao.com/h5/mtop.test/1.0/?appKey=12574478"
        result = analyzer.analyze_request(
            url=url,
            method='GET',
            name='测试请求'
        )
        
        assert result is not None
        assert result['name'] == '测试请求'
        assert result['method'] == 'GET'
    
    def test_batch_analyze(self, tmp_path):
        """测试批量分析"""
        analyzer = CaptureAnalyzer(output_dir=str(tmp_path / "analysis"))
        
        data_list = [
            {
                'type': 'html',
                'name': '测试页面',
                'content': '<html><body>Test</body></html>'
            },
            {
                'type': 'request',
                'name': '测试请求',
                'url': 'https://test.com/api',
                'method': 'GET'
            },
            {
                'type': 'response',
                'name': '测试响应',
                'content': '{"ret":["SUCCESS"],"data":{}}'
            }
        ]
        
        summary = analyzer.load_capture_batch(data_list)
        
        assert summary['total'] == 3
        assert summary['html_count'] == 1
        assert summary['request_count'] == 1
        assert summary['response_count'] == 1
    
    def test_export_results(self, tmp_path):
        """测试导出结果"""
        analyzer = CaptureAnalyzer(output_dir=str(tmp_path / "analysis"))
        
        analyzer.analyze_request('https://test.com', name='test')
        
        output_file = analyzer.export_results('test_results.json')
        
        assert output_file != ""
        assert Path(output_file).exists()


# 运行测试
if __name__ == '__main__':
    pytest.main([__file__, '-v'])
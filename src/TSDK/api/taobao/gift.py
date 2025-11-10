"""
天猫礼享金API模块 - 精简版
专注于红包兑换功能
"""

from typing import Dict, Any, Optional, List
from collections import OrderedDict
from .h5 import TaobaoH5
from loguru import logger
import json


class TmallGiftAPI(TaobaoH5):
    """天猫礼享金API类 - 红包兑换专用"""
    
    def __init__(self):
        super().__init__()
        
        # API配置
        self.gift_api_base = 'https://h5api.m.tmall.com/h5'
        self.referer = 'https://pages.tmall.com/'
        
        # 请求配置
        self.appKey = '12574478'
        self.jsv = '2.6.1'
        self.timeout = 4096
        
    def get_exchange_all_page(self, data: Dict[str, Any] = {}) -> Optional[Dict[str, Any]]:
        """
        获取礼享金兑换页面所有数据
        API: mtop.fission.gift.share.vcoin.exchange.allpage
        版本: 1.0
        需要登录: 否
        
        Returns:
            包含红包列表等完整数据
        """
        method = 'GET'
        params = {
            'jsv': self.jsv,
            'appKey': self.appKey,
            'api': 'mtop.fission.gift.share.vcoin.exchange.allpage',
            'v': '1.0',
            'timeout': self.timeout,
            'needRetry': True,
            'type': 'jsonp',
            'dataType': 'jsonp',
            'callback': 'mtopjsonp2',
            'data': data or {}
        }
        
        url = f'{self.gift_api_base}/mtop.fission.gift.share.vcoin.exchange.allpage/1.0/'
        
        request_options = OrderedDict()
        request_options['method'] = method
        request_options['url'] = url
        request_options['params'] = params
        
        # 设置Referer
        request_options['headers'] = {
            **self.headers,
            'Referer': self.referer
        }
        
        result, res = self._execute(request_options)
        
        if result.get('ret', [])[0].startswith('SUCCESS'):
            logger.success(f"成功获取礼享金页面数据")
            return result.get('data')
        else:
            logger.error(f"获取礼享金页面失败: {result.get('ret')}")
            return None
    
    def exchange_red_packet(self, benefit_code: str, asac: str = '',
                           ua: str = '', umid_token: str = '', **kwargs) -> Optional[Dict[str, Any]]:
        """
        兑换红包 - 基于真实抓包数据实现
        API: mtop.fisson.gift.share.vcoin.exchange (注意是fisson不是fission)
        版本: 1.0
        需要登录: 是
        
        Args:
            benefit_code: 红包标识码 (benefitCode)
            asac: 风控参数 (每次请求都不同)
            ua: 设备指纹 (超长Base64字符串，可从页面JS获取)
            umid_token: 设备唯一标识token (可从Cookie或LocalStorage获取)
            **kwargs: 其他参数
            
        Returns:
            兑换结果
            
        Example:
            >>> api = TmallGiftAPI()
            >>> # 从红包列表获取benefitCode
            >>> red_packets = api.get_red_packets()
            >>> benefit_code = red_packets[0]['benefitCode']
            >>> result = api.exchange_red_packet(benefit_code, asac='xxx', ua='xxx', umid_token='xxx')
        """
        method = 'GET'
        
        # 构建请求数据 - 基于真实抓包数据
        request_data = {
            'asac': asac,
            'benefitCode': benefit_code,
            'type': 'redPacket',  # 固定为redPacket
            **kwargs
        }
        
        # 如果提供了ua和umidToken，添加到请求数据中
        if ua:
            request_data['ua'] = ua
        if umid_token:
            request_data['umidToken'] = umid_token
        
        # URL参数 - 基于真实抓包数据
        params = {
            'jsv': self.jsv,
            'appKey': self.appKey,
            'api': 'mtop.fisson.gift.share.vcoin.exchange',  # 注意：是fisson不是fission
            'v': '1.0',
            'ecode': '1',
            'timeout': self.timeout,
            'isSec': '1',
            'secType': '2',
            'needWua': 'true',
            'isNeedWua': 'true',
            'needRetry': 'true',
            'type': 'jsonp',
            'dataType': 'jsonp',
            'asac': asac,
            'callback': 'mtopjsonp7',
            'data': request_data
        }
        
        # 注意：API路径也是fisson
        url = f'{self.gift_api_base}/mtop.fisson.gift.share.vcoin.exchange/1.0/'
        
        request_options = OrderedDict()
        request_options['method'] = method
        request_options['url'] = url
        request_options['params'] = params
        
        request_options['headers'] = {
            **self.headers,
            'Referer': self.referer
        }
        
        result, res = self._execute(request_options)
        
        if result.get('ret', [])[0].startswith('SUCCESS'):
            logger.success(f"兑换红包成功! benefitCode: {benefit_code}")
            return result.get('data')
        else:
            logger.error(f"兑换红包失败: {result.get('ret')}")
            return None
    
    def get_red_packets(self) -> List[Dict[str, Any]]:
        """
        获取红包列表
        
        Returns:
            红包列表（话费券、红包等）
        """
        page_data = self.get_exchange_all_page()
        
        if not page_data:
            return []
        
        # 话费红包
        phone_packets = page_data.get('phoneBillModule', {}).get('redPackets', [])
        # 普通红包
        normal_packets = page_data.get('redPacketModule', {}).get('redPackets', [])
        
        all_packets = phone_packets + normal_packets
        
        # 筛选可用红包
        available_packets = [
            packet for packet in all_packets
            if packet.get('status') == 'AVAILABLE'
        ]
        
        logger.info(f"发现 {len(available_packets)} 个可兑换红包")
        
        return available_packets
    
    def get_user_balance(self) -> Dict[str, Any]:
        """
        获取用户礼享金余额
        
        Returns:
            余额信息
        """
        page_data = self.get_exchange_all_page()
        
        if not page_data:
            return {'balance': 0, 'unit': '礼享金'}
        
        # 从多个可能的位置获取余额
        balance_info = {}
        
        # 从提现模块获取
        withdrawal_module = page_data.get('withdrawalModule', {})
        if withdrawal_module:
            balance_info['totalAmount'] = withdrawal_module.get('totalAmount', '0')
            balance_info['availableAmount'] = withdrawal_module.get('availableAmount', '0')
        
        # 从红包模块获取
        red_packet_module = page_data.get('redPacketModule', {})
        if red_packet_module:
            balance_info['coinAmount'] = red_packet_module.get('totalCoinAmount', '0')
        
        logger.info(f"礼享金余额: {balance_info}")
        
        return balance_info

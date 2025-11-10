"""
抓包数据分析结果
自动生成时间: 2025-11-10
"""

# ==================== 发现的API列表 ====================

DISCOVERED_APIS = {
    'exchange_list': {
        'api': 'mtop.fission.gift.share.vcoin.exchange.allpage',
        'version': '1.0',
        'method': 'GET',
        'need_login': False,
        'description': '兑换页面-获取礼享金商品列表',
        'endpoint': 'https://h5api.m.tmall.com/h5/mtop.fission.gift.share.vcoin.exchange.allpage/1.0/',
        'parameters': {
            'jsv': '2.6.1',
            'appKey': '12574478',
            't': 'timestamp',
            'sign': 'calculated_sign',
            'api': 'mtop.fission.gift.share.vcoin.exchange.allpage',
            'v': '1.0',
            'timeout': 4096,
            'needRetry': True,
            'type': 'jsonp',
            'dataType': 'jsonp',
            'callback': 'mtopjsonp2',
            'data': '{}'
        }
    },
    'exchange': {
        'api': 'mtop.fission.gift.share.vcoin.exchange',
        'version': '1.0',
        'method': 'POST',
        'need_login': True,
        'description': '兑换接口-兑换礼享金商品',
        'endpoint': 'https://h5api.m.tmall.com/h5/mtop.fission.gift.share.vcoin.exchange/1.0/'
    },
    'withdrawal': {
        'api': 'mtop.fission.gift.share.vcoin.withdrawal.draw',
        'version': '1.0',
        'method': 'POST',
        'need_login': True,
        'description': '提现接口-将礼享金提现到支付宝',
        'endpoint': 'https://h5api.m.tmall.com/h5/mtop.fission.gift.share.vcoin.withdrawal.draw/1.0/'
    }
}

# ==================== Cookie 参数分析 ====================

REQUIRED_COOKIES = [
    'cookie2',           # 用户认证token
    '_m_h5_tk',         # MTOP H5 Token (重要! 用于签名)
    '_m_h5_tk_enc',     # MTOP H5 Token 加密版本
    '_tb_token_',       # 淘宝Token
    'cna',              # 客户端标识
    'miid',             # 用户ID
    'lid',              # 登录ID
    'unb',              # 用户编号
    'tracknick',        # 跟踪昵称
    't',                # Token时间戳
    'isg',              # ISG签名
    'tfstk'             # TF Stack Token
]

# ==================== 签名算法分析 ====================

SIGN_ALGORITHM = {
    'description': '淘宝MTOP签名算法',
    'key_source': '_m_h5_tk的前半部分(以_分割)',
    'input_format': 'token + "&" + timestamp + "&" + appKey + "&" + data',
    'hash_method': 'MD5',
    'example': {
        '_m_h5_tk': 'c42ef826975173674dedca2a4d15fe35_1762670501441',
        'token_key': 'c42ef826975173674dedca2a4d15fe35',
        'timestamp': '1762663136296',
        'appKey': '12574478',
        'data': '{}',
        'sign_input': 'c42ef826975173674dedca2a4d15fe35&1762663136296&12574478&{}',
        'sign_output': '478769243eccb5ecbf64cf2db933d480'
    },
    'notes': [
        '_m_h5_tk格式: {token}_{timestamp}',
        '签名算法: MD5(token & timestamp & appKey & data)',
        '时间戳必须是13位毫秒级',
        '所有参数按顺序拼接，使用&分隔'
    ]
}

# ==================== 响应数据结构 ====================

RESPONSE_STRUCTURE = {
    'exchange_list': {
        'accountTips': 'str - 提现至支付宝提示',
        'drawAsacCode': 'str - 风控代码',
        'itemModule': {
            'items': [
                {
                    'itemId': 'int/str - 商品ID',
                    'itemTitle': 'str - 商品标题',
                    'itemPic': 'str - 商品图片URL',
                    'itemUrl': 'str - 商品详情URL',
                    'gitCoinAmount': 'str - 所需礼享金数量',
                    'goodsPrice': 'str - 商品原价',
                    'promotionPrice': 'str - 促销价',
                    'status': 'str - 状态(AVAILABLE/SOLD_OUT)',
                    'btnText': 'str - 按钮文字',
                    'buttonTips': 'str - 按钮提示',
                    'order': 'int - 排序',
                    'whiteBgPictureUrl': 'str - 白色背景图片'
                }
            ]
        },
        'withdrawalModule': {
            'hasWithdrawal': 'bool - 是否可提现',
            'totalAmount': 'str - 总金额',
            'withdrawalAccount': 'str - 提现账户',
            'tipText': 'str - 提示文本',
            'termDTOList': [
                {
                    'id': 'str - 提现档位ID',
                    'cashOutValue': 'str - 提现金额',
                    'cashOutTips': 'str - 提现提示',
                    'limitTips': 'str - 限制条件',
                    'buttonTips': 'str - 按钮提示'
                }
            ]
        },
        'phoneBillModule': {
            'redAsacCode': 'str - 风控代码',
            'redPackets': [
                {
                    'benefitCode': 'str - 权益代码',
                    'amount': 'str - 金额',
                    'cent': 'int - 分',
                    'coinAmount': 'str - 礼享金数量',
                    'title': 'str - 标题',
                    'desc': 'str - 描述',
                    'subDesc': 'str - 副描述',
                    'status': 'str - 状态',
                    'btnText': 'str - 按钮文字',
                    'buttonTips': 'str - 按钮提示'
                }
            ]
        },
        'redPacketModule': {
            'redPackets': '同phoneBillModule.redPackets结构'
        }
    }
}

# ==================== 请求头模板 ====================

REQUEST_HEADERS_TEMPLATE = {
    ':authority': 'h5api.m.tmall.com',
    ':method': 'GET',  # 或 POST
    ':scheme': 'https',
    'accept': '*/*',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'zh-CN,zh;q=0.9',
    'cookie': '{cookies}',  # 动态填充
    'referer': 'https://pages.tmall.com/',
    'sec-ch-ua': '"Microsoft Edge";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'script',
    'sec-fetch-mode': 'no-cors',
    'sec-fetch-site': 'same-site',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0'
}

# ==================== 商品数据示例 ====================

EXAMPLE_PRODUCTS = [
    {
        'itemId': '777155634115',
        'itemTitle': 'type-c数据线',
        'gitCoinAmount': '0.5',
        'goodsPrice': '3.8',
        'promotionPrice': '3',
        'status': 'AVAILABLE'
    },
    {
        'itemId': '775325947418',
        'itemTitle': '手机支架',
        'gitCoinAmount': '3',
        'goodsPrice': '5.01',
        'promotionPrice': '4.95',
        'status': 'AVAILABLE'
    },
    {
        'itemId': '783465638673',
        'itemTitle': '国风蒸汽眼罩30片',
        'gitCoinAmount': '2',
        'goodsPrice': '12.9',
        'promotionPrice': '9.9',
        'status': 'AVAILABLE'
    }
]

# ==================== 关键发现 ====================

KEY_FINDINGS = {
    'app_key': '12574478',  # 固定的AppKey
    'jsv': '2.6.1',          # JavaScript版本
    'base_domain': 'h5api.m.tmall.com',
    'referer': 'https://pages.tmall.com/',
    'timeout': 4096,
    'sign_valid_duration': 300,  # 签名有效期约5分钟
    'token_refresh_needed': True,  # _m_h5_tk需要定期刷新
    'callback_prefix': 'mtopjsonp',  # JSONP回调前缀
    
    'product_status': {
        'AVAILABLE': '可兑换',
        'SOLD_OUT': '已抢光',
        'INSUFFICIENT_COINS': '礼享金不足'
    },
    
    'asac_codes': {
        'draw': 'drawAsacCode',   # 提现风控码
        'red': 'redAsacCode'       # 红包风控码
    }
}

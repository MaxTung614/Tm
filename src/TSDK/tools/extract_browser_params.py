"""
从浏览器提取ua和umidToken参数的工具
"""

from playwright.sync_api import sync_playwright
from loguru import logger
import json
import time


class BrowserParamsExtractor:
    """浏览器参数提取器"""
    
    def __init__(self, headless: bool = False):
        """
        初始化
        
        Args:
            headless: 是否无头模式
        """
        self.headless = headless
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None
    
    def start(self):
        """启动浏览器"""
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=self.headless)
        self.context = self.browser.new_context()
        self.page = self.context.new_page()
        logger.info("浏览器已启动")
    
    def stop(self):
        """关闭浏览器"""
        if self.page:
            self.page.close()
        if self.context:
            self.context.close()
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
        logger.info("浏览器已关闭")
    
    def load_cookies(self, cookies: dict):
        """
        加载Cookie到浏览器
        
        Args:
            cookies: Cookie字典
        """
        if not self.context:
            raise RuntimeError("浏览器未启动，请先调用start()")
        
        # 转换Cookie格式
        cookie_list = []
        for name, value in cookies.items():
            cookie_list.append({
                'name': name,
                'value': value,
                'domain': '.tmall.com',
                'path': '/'
            })
        
        self.context.add_cookies(cookie_list)
        logger.success(f"已加载 {len(cookie_list)} 个Cookie")
    
    def extract_params_from_page(self, url: str = None) -> dict:
        """
        从礼享金页面提取ua和umidToken参数
        
        Args:
            url: 礼享金页面URL，默认使用标准URL
            
        Returns:
            包含ua和umidToken的字典
        """
        if not self.page:
            raise RuntimeError("浏览器未启动，请先调用start()")
        
        if url is None:
            url = "https://pages.tmall.com/wow/an/tmall/user-growth/share-benefit-exchange"
        
        logger.info(f"正在访问页面: {url}")
        self.page.goto(url)
        
        # 等待页面加载
        logger.info("等待页面加载...")
        time.sleep(3)
        
        # 尝试多种方法提取参数
        params = {}
        
        # 方法1: 从全局变量提取
        logger.info("尝试从全局变量提取参数...")
        try:
            ua = self.page.evaluate("""
                () => {
                    // 尝试多个可能的变量名
                    return window._umdata?.ua || 
                           window.umidData?.ua || 
                           window.UA || 
                           '';
                }
            """)
            if ua:
                params['ua'] = ua
                logger.success(f"成功提取ua参数 (长度: {len(ua)})")
        except Exception as e:
            logger.warning(f"从全局变量提取ua失败: {e}")
        
        try:
            umid_token = self.page.evaluate("""
                () => {
                    return window._umdata?.umidToken || 
                           window.umidData?.umidToken || 
                           window.umidToken || 
                           '';
                }
            """)
            if umid_token:
                params['umidToken'] = umid_token
                logger.success("成功提取umidToken参数")
        except Exception as e:
            logger.warning(f"从全局变量提取umidToken失败: {e}")
        
        # 方法2: 从LocalStorage提取
        logger.info("尝试从LocalStorage提取参数...")
        try:
            local_storage = self.page.evaluate("() => Object.assign({}, localStorage)")
            
            # 查找可能包含ua或umidToken的key
            for key, value in local_storage.items():
                if 'ua' in key.lower() and not params.get('ua'):
                    params['ua'] = value
                    logger.success(f"从LocalStorage提取ua: key={key}")
                
                if 'umid' in key.lower() and not params.get('umidToken'):
                    params['umidToken'] = value
                    logger.success(f"从LocalStorage提取umidToken: key={key}")
        except Exception as e:
            logger.warning(f"从LocalStorage提取失败: {e}")
        
        # 方法3: 从SessionStorage提取
        logger.info("尝试从SessionStorage提取参数...")
        try:
            session_storage = self.page.evaluate("() => Object.assign({}, sessionStorage)")
            
            for key, value in session_storage.items():
                if 'ua' in key.lower() and not params.get('ua'):
                    params['ua'] = value
                    logger.success(f"从SessionStorage提取ua: key={key}")
                
                if 'umid' in key.lower() and not params.get('umidToken'):
                    params['umidToken'] = value
                    logger.success(f"从SessionStorage提取umidToken: key={key}")
        except Exception as e:
            logger.warning(f"从SessionStorage提取失败: {e}")
        
        # 方法4: 拦截网络请求
        logger.info("尝试从网络请求中提取参数...")
        extracted_from_network = self._extract_from_network_requests()
        params.update(extracted_from_network)
        
        return params
    
    def _extract_from_network_requests(self) -> dict:
        """
        从网络请求中提取参数
        
        Returns:
            提取到的参数字典
        """
        params = {}
        
        # 监听网络请求
        requests_data = []
        
        def handle_request(request):
            if 'mtop.fisson.gift.share.vcoin.exchange' in request.url:
                requests_data.append({
                    'url': request.url,
                    'post_data': request.post_data
                })
        
        self.page.on('request', handle_request)
        
        # 触发兑换请求（如果可能）
        # 这里需要实际点击兑换按钮，暂时跳过
        
        # 分析请求数据
        for req_data in requests_data:
            url = req_data['url']
            # 从URL参数中提取
            if 'ua=' in url:
                # 提取ua参数
                pass
        
        return params
    
    def save_params_to_file(self, params: dict, filepath: str):
        """
        保存参数到文件
        
        Args:
            params: 参数字典
            filepath: 保存路径
        """
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(params, f, ensure_ascii=False, indent=2)
        
        logger.success(f"参数已保存到: {filepath}")


def main():
    """主程序 - 提取浏览器参数"""
    logger.info("=" * 80)
    logger.info("浏览器参数提取工具")
    logger.info("用于提取ua和umidToken参数")
    logger.info("=" * 80)
    
    # 初始化提取器
    extractor = BrowserParamsExtractor(headless=False)
    
    try:
        # 启动浏览器
        extractor.start()
        
        # 加载Cookie（需要先从CookieManager获取）
        from TSDK.utils.cookie_manager import CookieManager
        cookie_manager = CookieManager()
        
        user_id = "maxtung614"  # 替换为您的用户名
        cookies = cookie_manager.get_cookies(user_id)
        
        if cookies:
            extractor.load_cookies(cookies)
        else:
            logger.warning("未找到Cookie，将尝试在未登录状态下提取参数")
        
        # 提取参数
        params = extractor.extract_params_from_page()
        
        # 显示结果
        logger.info("\n" + "=" * 80)
        logger.info("提取结果:")
        logger.info("=" * 80)
        
        if params.get('ua'):
            logger.success(f"✅ ua: {params['ua'][:50]}... (长度: {len(params['ua'])})")
        else:
            logger.warning("❌ ua: 未提取到")
        
        if params.get('umidToken'):
            logger.success(f"✅ umidToken: {params['umidToken']}")
        else:
            logger.warning("❌ umidToken: 未提取到")
        
        # 保存到文件
        if params:
            extractor.save_params_to_file(params, '/TSDK/data/browser_params.json')
        
        logger.info("=" * 80)
        
        # 如果参数未完整提取，提供手动提取指南
        if not params.get('ua') or not params.get('umidToken'):
            logger.info("\n手动提取指南:")
            logger.info("1. 打开浏览器开发者工具 (F12)")
            logger.info("2. 切换到 Console 标签")
            logger.info("3. 执行以下命令:")
            logger.info("\n   // 提取ua")
            logger.info("   window._umdata?.ua || window.umidData?.ua")
            logger.info("\n   // 提取umidToken")
            logger.info("   window._umdata?.umidToken || window.umidData?.umidToken")
            logger.info("\n4. 复制输出的值")
            logger.info("5. 或者从Network中兑换请求的data参数中复制")
        
    except Exception as e:
        logger.error(f"提取参数时出错: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # 关闭浏览器
        extractor.stop()


if __name__ == "__main__":
    main()

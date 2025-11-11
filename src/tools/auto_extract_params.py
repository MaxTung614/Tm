#!/usr/bin/env python3
"""
风控参数自动提取工具
基于详细指南实现的自动化提取脚本
"""
import re
import json
import time
from pathlib import Path
from typing import Optional, Dict, Any
from loguru import logger

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False
    logger.warning("Selenium 未安装，自动化提取功能将不可用")


class RiskParameterExtractor:
    """风控参数提取器"""
    
    def __init__(self):
        self.results = {
            "ua": "",
            "umidToken": "",
            "asac": "",
            "cookies": {},
            "lastUpdate": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "extraction_methods": {}
        }
    
    def extract_ua_comprehensive(self, driver) -> str:
        """
        综合提取 UA（设备指纹）
        
        方法：
        1. navigator.userAgent
        2. localStorage.getItem('RISK_DEVICE_FINGERPRINT')
        3. window.AWSC.ua
        """
        logger.info("提取 UA（设备指纹）...")
        
        ua_sources = []
        
        try:
            # 方法1: 标准 User-Agent
            standard_ua = driver.execute_script("return navigator.userAgent;")
            if standard_ua:
                ua_sources.append({
                    "method": "navigator.userAgent",
                    "value": standard_ua,
                    "length": len(standard_ua)
                })
            
            # 方法2: RISK_DEVICE_FINGERPRINT
            risk_fingerprint = driver.execute_script("""
                return localStorage.getItem('RISK_DEVICE_FINGERPRINT') || 
                       localStorage.getItem('_m_h5_ua') || 
                       '';
            """)
            if risk_fingerprint:
                ua_sources.append({
                    "method": "localStorage.RISK_DEVICE_FINGERPRINT",
                    "value": risk_fingerprint,
                    "length": len(risk_fingerprint)
                })
            
            # 方法3: window.AWSC.ua
            awsc_ua = driver.execute_script("""
                return (window.AWSC && window.AWSC.ua) || '';
            """)
            if awsc_ua:
                ua_sources.append({
                    "method": "window.AWSC.ua",
                    "value": awsc_ua,
                    "length": len(awsc_ua)
                })
            
            # 选择最长的 UA（通常是设备指纹）
            if ua_sources:
                best_ua = max(ua_sources, key=lambda x: x['length'])
                self.results["ua"] = best_ua["value"]
                self.results["extraction_methods"]["ua"] = {
                    "method": best_ua["method"],
                    "alternatives": len(ua_sources)
                }
                logger.success(f"✅ UA 提取成功 (方法: {best_ua['method']}, 长度: {best_ua['length']})")
                return best_ua["value"]
            
        except Exception as e:
            logger.error(f"提取 UA 失败: {e}")
        
        return ""
    
    def extract_umid_comprehensive(self, driver) -> str:
        """
        综合提取 umidToken
        
        查找位置：
        1. Cookie
        2. LocalStorage
        3. SessionStorage
        4. window.AWSC.umid
        """
        logger.info("提取 umidToken...")
        
        umid_sources = []
        
        try:
            # 方法1: Cookie
            cookies = driver.get_cookies()
            for cookie in cookies:
                if 'umid' in cookie['name'].lower():
                    umid_sources.append({
                        "method": f"Cookie.{cookie['name']}",
                        "value": cookie['value']
                    })
            
            # 方法2: LocalStorage
            local_storage_umid = driver.execute_script("""
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.toLowerCase().includes('umid')) {
                        return localStorage.getItem(key);
                    }
                }
                return '';
            """)
            if local_storage_umid:
                umid_sources.append({
                    "method": "localStorage",
                    "value": local_storage_umid
                })
            
            # 方法3: SessionStorage
            session_storage_umid = driver.execute_script("""
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    if (key.toLowerCase().includes('umid')) {
                        return sessionStorage.getItem(key);
                    }
                }
                return '';
            """)
            if session_storage_umid:
                umid_sources.append({
                    "method": "sessionStorage",
                    "value": session_storage_umid
                })
            
            # 方法4: window.AWSC.umid（最可靠）
            awsc_umid = driver.execute_script("""
                return (window.AWSC && window.AWSC.umid) || '';
            """)
            if awsc_umid:
                umid_sources.append({
                    "method": "window.AWSC.umid",
                    "value": awsc_umid,
                    "priority": 1  # 最高优先级
                })
            
            # 优先选择 window.AWSC.umid
            if umid_sources:
                priority_source = next((s for s in umid_sources if s.get('priority') == 1), None)
                best_umid = priority_source or umid_sources[0]
                
                self.results["umidToken"] = best_umid["value"]
                self.results["extraction_methods"]["umidToken"] = {
                    "method": best_umid["method"],
                    "alternatives": len(umid_sources)
                }
                logger.success(f"✅ umidToken 提取成功 (方法: {best_umid['method']})")
                return best_umid["value"]
            
        except Exception as e:
            logger.error(f"提取 umidToken 失败: {e}")
        
        return ""
    
    def extract_asac_comprehensive(self, driver) -> str:
        """
        尝试提取 ASAC 参数
        
        注意：ASAC 通常需要从实际兑换请求中抓包获取
        这里只能尝试从页面 JavaScript 中查找
        """
        logger.info("尝试提取 ASAC...")
        
        try:
            # 方法1: 从全局变量
            asac_from_global = driver.execute_script("""
                const searchKeys = ['asac', 'redAsacCode', 'drawAsacCode', 'ASAC'];
                for (const key of searchKeys) {
                    if (window[key]) {
                        return window[key];
                    }
                }
                return '';
            """)
            
            if asac_from_global:
                self.results["asac"] = asac_from_global
                self.results["extraction_methods"]["asac"] = {"method": "global_variable"}
                logger.success(f"✅ ASAC 提取成功: {asac_from_global}")
                return asac_from_global
            
            # 方法2: 从页面 HTML 中查找
            page_source = driver.page_source
            asac_patterns = [
                r'"redAsacCode"\s*:\s*"([^"]+)"',
                r'"drawAsacCode"\s*:\s*"([^"]+)"',
                r'asac["\s:=]+["\s]*([A-Z0-9]+)'
            ]
            
            for pattern in asac_patterns:
                matches = re.findall(pattern, page_source)
                if matches:
                    self.results["asac"] = matches[0]
                    self.results["extraction_methods"]["asac"] = {"method": "page_html"}
                    logger.success(f"✅ ASAC 提取成功: {matches[0]}")
                    return matches[0]
            
            logger.warning("⚠️ 未找到 ASAC，需要从抓包的 exchange 请求中获取")
            
        except Exception as e:
            logger.error(f"提取 ASAC 失败: {e}")
        
        return ""
    
    def extract_cookies(self, driver) -> Dict[str, str]:
        """提取重要的 Cookie"""
        logger.info("提取 Cookie...")
        
        important_cookies = [
            '_m_h5_tk', '_m_h5_tk_enc', '_tb_token_', 
            'cookie2', 'sgcookie', 'unb', '_nk_'
        ]
        
        try:
            cookies = driver.get_cookies()
            for cookie in cookies:
                if cookie['name'] in important_cookies:
                    self.results["cookies"][cookie['name']] = cookie['value']
            
            logger.success(f"✅ 提取了 {len(self.results['cookies'])} 个重要 Cookie")
            
        except Exception as e:
            logger.error(f"提取 Cookie 失败: {e}")
        
        return self.results["cookies"]
    
    def extract_all(self, url: str = "https://pages.tmall.com/wow/z/tmtjb/tj/coin/index") -> Dict[str, Any]:
        """
        自动提取所有风控参数
        
        Args:
            url: 目标页面 URL
        
        Returns:
            提取结果字典
        """
        if not SELENIUM_AVAILABLE:
            logger.error("Selenium 未安装，请运行: pip install selenium")
            return {}
        
        logger.info("=" * 60)
        logger.info("开始自动提取风控参数")
        logger.info("=" * 60)
        
        options = Options()
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        # 设置移动端 UA（模拟手机访问）
        options.add_argument('--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1')
        
        driver = None
        try:
            driver = webdriver.Chrome(options=options)
            
            # 隐藏 webdriver 特征
            driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            logger.info(f"访问页面: {url}")
            driver.get(url)
            
            # 等待页面加载
            time.sleep(5)
            logger.info("页面加载完成")
            
            # 提取参数
            self.extract_ua_comprehensive(driver)
            self.extract_umid_comprehensive(driver)
            self.extract_asac_comprehensive(driver)
            self.extract_cookies(driver)
            
            # 生成报告
            logger.info("=" * 60)
            logger.info("提取完成！")
            logger.info("=" * 60)
            self._print_summary()
            
            return self.results
            
        except Exception as e:
            logger.error(f"自动提取失败: {e}")
            return {}
        finally:
            if driver:
                driver.quit()
    
    def _print_summary(self):
        """打印提取结果摘要"""
        print()
        print("📊 提取结果摘要:")
        print("-" * 60)
        
        # UA
        if self.results["ua"]:
            print(f"✅ UA: 已提取 (长度: {len(self.results['ua'])})")
            print(f"   方法: {self.results['extraction_methods'].get('ua', {}).get('method', 'unknown')}")
        else:
            print("❌ UA: 未提取")
        
        # umidToken
        if self.results["umidToken"]:
            print(f"✅ umidToken: 已提取 (长度: {len(self.results['umidToken'])})")
            print(f"   方法: {self.results['extraction_methods'].get('umidToken', {}).get('method', 'unknown')}")
        else:
            print("❌ umidToken: 未提取")
        
        # asac
        if self.results["asac"]:
            print(f"✅ asac: 已提取 ({self.results['asac']})")
            print(f"   方法: {self.results['extraction_methods'].get('asac', {}).get('method', 'unknown')}")
        else:
            print("⚠️  asac: 未提取（需要从抓包获取）")
        
        # Cookies
        print(f"✅ Cookies: {len(self.results['cookies'])} 个")
        
        print("-" * 60)
        
        # 验证
        is_valid = bool(self.results["ua"] and self.results["umidToken"])
        completeness = (
            (40 if self.results["ua"] else 0) +
            (40 if self.results["umidToken"] else 0) +
            (20 if self.results["asac"] else 0)
        )
        
        print(f"完整度: {completeness}%")
        print(f"可用性: {'✅ 可用' if is_valid else '❌ 不完整'}")
        print()
    
    def save_to_file(self, file_path: str = "data/risk_params.json"):
        """保存到文件"""
        try:
            Path(file_path).parent.mkdir(parents=True, exist_ok=True)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(self.results, f, indent=2, ensure_ascii=False)
            
            logger.success(f"✅ 配置已保存到: {file_path}")
            
        except Exception as e:
            logger.error(f"保存失败: {e}")


def main():
    """主函数"""
    print("=" * 60)
    print("🔐 风控参数自动提取工具")
    print("=" * 60)
    print()
    
    if not SELENIUM_AVAILABLE:
        print("❌ Selenium 未安装")
        print()
        print("请运行以下命令安装:")
        print("  pip install selenium")
        print()
        print("还需要安装 Chrome 浏览器和 ChromeDriver")
        return
    
    extractor = RiskParameterExtractor()
    
    # 提取参数
    results = extractor.extract_all()
    
    if results:
        # 保存到文件
        extractor.save_to_file()
        
        print()
        print("=" * 60)
        print("✅ 完成！")
        print("=" * 60)
        print()
        print("下一步:")
        print("1. 检查 data/risk_params.json 文件")
        print("2. 如果缺少 asac，请从浏览器抓包获取")
        print("3. 启动后端测试: start_backend.bat")
        print()
    else:
        print()
        print("❌ 提取失败")
        print()
        print("建议:")
        print("1. 检查是否安装了 Chrome 浏览器")
        print("2. 检查是否安装了 ChromeDriver")
        print("3. 查看错误日志")
        print()


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UMID Token 专用提取工具
专门用于获取天猫淘宝UMID设备令牌

使用方法:
    python tools/umid_token_extractor.py
    
方法选择:
    1. 浏览器提取 (推荐)
    2. API直接获取
    3. 手动提取指导

作者: Claude AI Assistant  
日期: 2025-11-10
"""

import os
import re
import json
import time
import requests
import logging
from typing import Optional, Dict, List
from urllib.parse import urlparse, parse_qs

# 尝试导入selenium
try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class UMIDTokenExtractor:
    """UMID Token专用提取器"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Referer': 'https://www.taobao.com/',
        })
    
    def extract_with_browser(self) -> Optional[str]:
        """使用浏览器提取UMID (最可靠的方法)"""
        if not SELENIUM_AVAILABLE:
            logger.error("Selenium未安装，无法使用浏览器提取")
            return None
        
        options = Options()
        # options.add_argument('--headless')  # 可以注释掉这行来看浏览器操作
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        driver = None
        try:
            logger.info("启动浏览器提取UMID...")
            driver = webdriver.Chrome(options=options)
            
            # 访问淘宝页面触发UMID生成
            logger.info("访问淘宝首页...")
            driver.get("https://www.taobao.com")
            time.sleep(5)  # 等待UMID生成
            
            # 尝试获取Cookie中的UMID
            cookies = driver.get_cookies()
            for cookie in cookies:
                if 'umid' in cookie['name'].lower():
                    logger.info(f"从Cookie获取UMID: {cookie['name']} = {cookie['value'][:20]}...")
                    return cookie['value']
            
            # 尝试从localStorage获取
            local_storage_umid = driver.execute_script("""
                // 查找可能的UMID相关键
                var umidKeys = ['_uab_collina', 'um_device', 'umid', 'UMID', 'device_id'];
                var localStorage_umid = null;
                
                for (var i = 0; i < localStorage.length; i++) {
                    var key = localStorage.key(i);
                    var value = localStorage.getItem(key);
                    
                    // 查找包含umid的键值对
                    if (umidKeys.some(function(umidKey) { 
                        return key.includes(umidKey) || value.includes(umidKey);
                    })) {
                        console.log('Found UMID in localStorage:', key, value);
                        if (!localStorage_umid && (key.includes('umid') || value.includes('umid'))) {
                            localStorage_umid = value;
                        }
                    }
                }
                
                // 如果没找到，检查全局变量
                if (!localStorage_umid) {
                    for (var key in window) {
                        if (typeof window[key] === 'string' && 
                            (key.includes('umid') || key.includes('UMID')) && 
                            window[key].length > 10) {
                            console.log('Found UMID in window:', key, window[key]);
                            localStorage_umid = window[key];
                            break;
                        }
                    }
                }
                
                return localStorage_umid;
            """)
            
            if local_storage_umid:
                logger.info(f"从localStorage获取UMID: {local_storage_umid[:20]}...")
                return local_storage_umid
            
            # 尝试从sessionStorage获取
            session_storage_umid = driver.execute_script("""
                for (var i = 0; i < sessionStorage.length; i++) {
                    var key = sessionStorage.key(i);
                    var value = sessionStorage.getItem(key);
                    if (key.toLowerCase().includes('umid') || value.toLowerCase().includes('umid')) {
                        return value;
                    }
                }
                return null;
            """)
            
            if session_storage_umid:
                logger.info(f"从sessionStorage获取UMID: {session_storage_umid[:20]}...")
                return session_storage_umid
                
            logger.warning("浏览器中未找到UMID")
            return None
            
        except Exception as e:
            logger.error(f"浏览器提取UMID失败: {e}")
            return None
        finally:
            if driver:
                driver.quit()
    
    def extract_from_api(self) -> Optional[str]:
        """从API响应中提取UMID"""
        try:
            logger.info("从API响应中查找UMID...")
            
            # 访问淘宝首页
            response = self.session.get("https://www.taobao.com", timeout=10)
            if response.status_code == 200:
                # 查找JavaScript中的UMID
                text = response.text
                umid_patterns = [
                    r'_uab_collina[=\s"\']+([a-zA-Z0-9_]+)',  # 淘宝常见的UMID变量
                    r'um_device[=\s"\']+([a-zA-Z0-9_]+)',
                    r'umid[=\s"\']+([a-zA-Z0-9_]+)',
                    r'UMID[=\s"\']+([a-zA-Z0-9_]+)',
                    r'window\._uab_collina\s*=\s*["\']([^"\']+)',  # 全局变量
                    r'_uab_collina["\s:]+["\s]*([a-zA-Z0-9_]+)'
                ]
                
                for pattern in umid_patterns:
                    matches = re.findall(pattern, text, re.IGNORECASE)
                    if matches:
                        logger.info(f"从页面响应中获取UMID: {matches[0][:20]}...")
                        return matches[0]
                
                # 查找网络请求中的UMID
                return self._extract_umid_from_network_response()
            
        except Exception as e:
            logger.warning(f"从API提取UMID失败: {e}")
        return None
    
    def _extract_umid_from_network_response(self) -> Optional[str]:
        """从网络响应中提取UMID"""
        try:
            # 尝试访问一些可能包含UMID的API
            api_urls = [
                "https://h5api.m.tmall.com/h5/mtop.fission.gift.share.vcoin.exchange.allpage/1.0/?data=%7B%7D",
                "https://www.tmall.com",
                "https://api.taobao.com/router/rest"
            ]
            
            for url in api_urls:
                try:
                    response = self.session.get(url, timeout=5)
                    if response.status_code == 200:
                        # 检查响应头中的UMID相关信息
                        set_cookie = response.headers.get('Set-Cookie', '')
                        if 'umid' in set_cookie.lower():
                            # 提取Cookie值
                            umid_match = re.search(r'umid[^=]*=([^;]+)', set_cookie, re.IGNORECASE)
                            if umid_match:
                                logger.info(f"从响应头获取UMID: {umid_match.group(1)[:20]}...")
                                return umid_match.group(1)
                except Exception as e:
                    continue
                    
        except Exception as e:
            logger.warning(f"从网络响应提取UMID失败: {e}")
        return None
    
    def get_manual_extraction_guide(self) -> str:
        """获取手动提取UMID的指导"""
        guide = """
=== 手动UMID Token提取指导 ===

由于UMID是动态生成的设备标识，通常需要在浏览器环境中获取。

方法1: 浏览器开发者工具 (推荐)
1. 打开Chrome/Edge浏览器
2. 访问 https://www.taobao.com 
3. 按F12打开开发者工具
4. 切换到"Application"(应用)标签
5. 在左侧选择"Storage" → "Local Storage" → "https://www.taobao.com"
6. 查找包含"umid"、"collina"或类似关键词的键值对
7. 记录对应的值

方法2: 控制台脚本
在浏览器控制台中执行:
```javascript
// 查找所有可能的UMID
function findUMID() {
    let umids = [];
    
    // 查找localStorage
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        let value = localStorage.getItem(key);
        if (key.includes('umid') || key.includes('collina') || 
            value.includes('umid') || value.includes('collina')) {
            umids.push({storage: 'localStorage', key: key, value: value});
        }
    }
    
    // 查找Cookie
    let cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
        let [name, value] = cookie.trim().split('=');
        if (name.toLowerCase().includes('umid') || 
            name.toLowerCase().includes('collina')) {
            umids.push({storage: 'cookie', key: name, value: value});
        }
    });
    
    console.log('找到的UMID:', umids);
    return umids;
}

findUMID();
```

方法3: 从现有Cookie文件提取
如果您有保存的淘宝Cookie文件，可以查找包含以下字段的值：
- _uab_collina
- umid
- um_device
- device_id

这些值通常是一长串数字+字母的组合。
        """
        return guide
    
    def save_extraction_log(self, umid_value: Optional[str], method: str, filename: str = None):
        """保存提取日志"""
        if filename is None:
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f"data/umid_extraction_{timestamp}.json"
        
        # 确保data目录存在
        os.makedirs(os.path.dirname(filename) if os.path.dirname(filename) else '.', exist_ok=True)
        
        log_data = {
            "extraction_time": time.strftime("%Y-%m-%d %H:%M:%S"),
            "method": method,
            "success": umid_value is not None,
            "umid_value": umid_value,
            "value_length": len(umid_value) if umid_value else 0,
            "preview": umid_value[:20] + "..." if umid_value and len(umid_value) > 20 else umid_value
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"提取日志已保存到: {filename}")
        return filename


def main():
    """主函数"""
    print("=" * 60)
    print("🔍 UMID Token 专用提取工具")
    print("=" * 60)
    
    extractor = UMIDTokenExtractor()
    
    if SELENIUM_AVAILABLE:
        print("✅ Selenium已安装")
        print("\n选择提取方法:")
        print("1. 浏览器自动提取 (推荐)")
        print("2. API直接获取")
        print("3. 手动提取指导")
        
        choice = input("\n请选择方法 (1-3, 默认1): ").strip() or "1"
        
        if choice == "1":
            print("\n🌐 使用浏览器自动提取UMID...")
            umid = extractor.extract_with_browser()
            
            if umid:
                print(f"\n✅ 成功获取UMID!")
                print(f"完整值: {umid}")
                print(f"预览: {umid[:30]}...")
                print(f"长度: {len(umid)}")
                extractor.save_extraction_log(umid, "browser_auto")
                
                # 询问是否保存到配置
                save_to_config = input("\n是否保存到 data/risk_params.json? (y/n, 默认y): ").strip().lower()
                if save_to_config != 'n':
                    try:
                        import sys
                        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                        from tools.param_manager import ParamManager
                        
                        manager = ParamManager()
                        manager.set_umid_token(umid)
                        print("✅ 已保存到配置文件")
                    except Exception as e:
                        print(f"⚠️ 自动保存失败: {e}")
                        print(f"请手动运行: python tools/param_manager.py set-umid \"{umid}\"")
            else:
                print("\n❌ 浏览器提取失败，尝试API获取...")
                umid = extractor.extract_from_api()
                if umid:
                    print(f"✅ API获取UMID: {umid[:20]}...")
                    extractor.save_extraction_log(umid, "api_fallback")
                else:
                    print("❌ 所有自动方法都失败，请查看手动提取指导")
                    print("\n" + extractor.get_manual_extraction_guide())
                    extractor.save_extraction_log(None, "failed")
        
        elif choice == "2":
            print("\n📡 使用API获取UMID...")
            umid = extractor.extract_from_api()
            
            if umid:
                print(f"✅ API获取UMID: {umid[:20]}...")
                extractor.save_extraction_log(umid, "api_direct")
            else:
                print("❌ API获取失败，请尝试浏览器方法或手动提取")
                extractor.save_extraction_log(None, "api_failed")
        
        elif choice == "3":
            print(extractor.get_manual_extraction_guide())
    
    else:
        print("⚠️ Selenium未安装，使用API方式...")
        print("\n📡 使用API获取UMID...")
        umid = extractor.extract_from_api()
        
        if umid:
            print(f"✅ API获取UMID: {umid[:20]}...")
            extractor.save_extraction_log(umid, "api_only")
        else:
            print("❌ API获取失败")
            print("\n建议安装Selenium进行浏览器提取:")
            print("pip install selenium")
            print("\n或查看手动提取指导:")
            print(extractor.get_manual_extraction_guide())
            extractor.save_extraction_log(None, "no_selenium")
    
    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()

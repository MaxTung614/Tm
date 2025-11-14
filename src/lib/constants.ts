/**
 * 系统常量配置
 * 
 * 本文件定义了天猫礼享金抢购系统的核心常量
 */

/**
 * 目标红包列表
 * 
 * 系统核心功能：只抢购这11个指定的红包
 * 基于真实网络抓包数据（2025-11-09）
 */
export const TARGET_RED_PACKETS = [
  '4a7c9e8c194046de951c87ac3187e325', // 800元红包 - 满801可用
  '2713305bd3794de5aede654a29a095c5', // 500元红包 - 满1000可用
  'a81f95d722754c2dab43c4b2ed6af2f8', // 400元红包 - 满800可用
  '6481479dd84f44d79d6673e1549bb77a', // 200元红包 - 满400可用
  '87914c3e0aa2413dab93b4f1f28c67e6', // 100元红包 - 满200可用
  '9e71ee40134942d29429dbe18d8c9039', // 50元红包 - 满100可用
  '49a62b1b07184907a569d7c1c602b55c', // 30元红包 - 满60可用
  '450dd5075ffb43bbb1e5321249a98baa', // 10元红包 - 满11可用
  'df0c915232844692913064bcec3d6978', // 满20减10
  'a31505ebbd26470e813ff145672e24e7', // 5元红包 - 满6可用
  '1087d87c19414db8aad18b643e096ce5', // 5元红包 - 满10可用
] as const;

/**
 * 红包信息映射表
 * 提供红包的详细信息，用于日志记录和UI显示
 */
export const RED_PACKET_INFO: Record<string, {
  name: string;
  amount: string;
  condition: string;
  priority: number; // 优先级，数字越小越优先
}> = {
  '4a7c9e8c194046de951c87ac3187e325': {
    name: '800元红包',
    amount: '800',
    condition: '满801可用',
    priority: 1
  },
  '2713305bd3794de5aede654a29a095c5': {
    name: '500元红包',
    amount: '500',
    condition: '满1000可用',
    priority: 2
  },
  'a81f95d722754c2dab43c4b2ed6af2f8': {
    name: '400元红包',
    amount: '400',
    condition: '满800可用',
    priority: 3
  },
  '6481479dd84f44d79d6673e1549bb77a': {
    name: '200元红包',
    amount: '200',
    condition: '满400可用',
    priority: 4
  },
  '87914c3e0aa2413dab93b4f1f28c67e6': {
    name: '100元红包',
    amount: '100',
    condition: '满200可用',
    priority: 5
  },
  '9e71ee40134942d29429dbe18d8c9039': {
    name: '50元红包',
    amount: '50',
    condition: '满100可用',
    priority: 6
  },
  '49a62b1b07184907a569d7c1c602b55c': {
    name: '30元红包',
    amount: '30',
    condition: '满60可用',
    priority: 7
  },
  '450dd5075ffb43bbb1e5321249a98baa': {
    name: '10元红包',
    amount: '10',
    condition: '满11可用',
    priority: 8
  },
  'df0c915232844692913064bcec3d6978': {
    name: '满20减10',
    amount: '10',
    condition: '满20可用',
    priority: 9
  },
  'a31505ebbd26470e813ff145672e24e7': {
    name: '5元红包',
    amount: '5',
    condition: '满6可用',
    priority: 10
  },
  '1087d87c19414db8aad18b643e096ce5': {
    name: '5元红包',
    amount: '5',
    condition: '满10可用',
    priority: 11
  }
};

/**
 * 检查红包是否在目标列表中
 */
export function isTargetRedPacket(benefitCode: string): boolean {
  return TARGET_RED_PACKETS.includes(benefitCode as any);
}

/**
 * 获取红包信息
 */
export function getRedPacketInfo(benefitCode: string) {
  return RED_PACKET_INFO[benefitCode] || null;
}

/**
 * 过滤出目标红包
 */
export function filterTargetRedPackets<T extends { benefitCode: string }>(packets: T[]): T[] {
  return packets.filter(packet => isTargetRedPacket(packet.benefitCode));
}

/**
 * 按优先级排序红包
 */
export function sortRedPacketsByPriority<T extends { benefitCode: string }>(packets: T[]): T[] {
  return packets.sort((a, b) => {
    const infoA = getRedPacketInfo(a.benefitCode);
    const infoB = getRedPacketInfo(b.benefitCode);
    
    if (!infoA || !infoB) return 0;
    
    return infoA.priority - infoB.priority;
  });
}

// 修改后的 src/index.ts（兼容方案）
import { hrtime } from 'process';

import { updateChannelsJson } from './channels';
// 注释掉 EPG 导入，但保留以备后用（如果函数签名需要）
// import { epgs_sources } from './epgs';
// import { buildEpgPwXml } from './epgs/epg_pw';
import {
  cleanFiles,
  getContent,
  mergeSources,
  mergeTxts,
  // 注释掉未使用的 EPG 函数
  // writeEpgJsonByDate,
  // writeEpgXML,
  writeM3u,
  writeM3uToTxt,
  writeSources,
} from './file';
import { updateChannelList, updateReadme } from './readme';
import { sources } from './sources';
import { runCustomTask } from './task/custom';
import { writeTvBoxJson as writeTvBoxLiveJson } from './tvbox';
import { Collector } from './utils';

cleanFiles();

// 执行脚本
(async () => {
  try {
    const sourcesResult = await Promise.allSettled(
      sources.map(async (sr) => {
        // ... 保持不变 ...
      })
    );

    // 跳过 EPG 抓取，直接使用空数组
    const epgs_sources = []; // 空数组
    const epgs_res = []; // 空结果

    console.log(`[TASK] Write important files`);
    type SourceSettled = PromiseSettledResult<(string | number)[] | (string | undefined)[]>;
    const sources_res = sourcesResult.map((r: SourceSettled) =>
      r.status === 'fulfilled' ? r.value : undefined
    ) as Array<[string, number | undefined]>;
    
    mergeTxts();
    mergeSources();
    
    // 跳过 EPG JSON 生成
    // await writeEpgJsonByDate();
    
    await writeTvBoxLiveJson('tvbox', sources);
    
    // 传递空数组作为 EPG 参数，保持函数签名不变
    updateChannelsJson(sources, sources_res, epgs_sources);
    updateReadme(sources, sources_res, epgs_sources, epgs_res);

    console.log(`[TASK] Make custom sources`);
    runCustomTask();
  } catch (err) {
    console.error(err);
  }
})();

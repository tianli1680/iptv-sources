import { hrtime } from 'process';

import { updateChannelsJson } from './channels';
// 注释掉 EPG 导入
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
        console.log(`[TASK] Fetch ${sr.name}`);
        try {
          const [ok, text, now] = await getContent(sr);
          if (ok && !!text) {
            console.log(
              `Fetch m3u from ${sr.name} finished, cost ${
                (parseInt(hrtime.bigint().toString()) - parseInt(now.toString())) / 10e6
              } ms`
            );

            const sourcesCollector = Collector(undefined, (v) => !/^([a-z]+):\/\//.test(v));

            const [m3u, count] = sr.filter(
              text as string,
              ['o_all', 'all'].includes(sr.f_name) ? 'skip' : 'normal',
              sourcesCollector.collect
            );

            await writeM3u(sr.f_name, m3u);
            await writeM3uToTxt(sr.name, sr.f_name, m3u);
            await writeSources(sr.name, sr.f_name, sourcesCollector.result());
            updateChannelList(sr.name, sr.f_name, m3u);
            return ['normal', count];
          }
          console.log(`[WARNING] m3u ${sr.name} get failed!`);
          return ['normal', void 0];
        } catch (e) {
          console.log(e);
          console.log(`[WARNING] m3u ${sr.name} get failed!`);
          return ['normal', void 0];
        }
      })
    );

    // 跳过所有 EPG 抓取
    console.log('[INFO] EPG fetching is disabled');
    
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
    
    // 传空数组给 EPG 参数，保持函数签名不变
    updateChannelsJson(sources, sources_res, []);
    updateReadme(sources, sources_res, [], []);

    console.log(`[TASK] Make custom sources`);
    runCustomTask();
  } catch (err) {
    console.error(err);
  }
})();

import fs from 'fs';
import path from 'path';

import { handle_m3u } from './sources';
import { get_from_info } from './utils';

export const updateChannelList = (
  name: string,
  f_name: string,
  m3u: string,
  rollback: boolean = false
) => {
  const list_temp_p = path.join(path.resolve(), 'LIST.temp.md');
  const list = fs.readFileSync(list_temp_p, 'utf8').toString();

  const m3uArray = handle_m3u(m3u);
  const channelRegExp = /#EXTINF:-1([^,]*),(.*)/;
  let i = 1;
  const channels: Array<string[]> = [];
  while (i < m3uArray.length) {
    const reg = channelRegExp.exec(m3uArray[i]) as RegExpExecArray;
    channels.push([
      reg[2].replace(/\|/g, '').trim(),
      get_from_info(m3uArray[i + 1]),
      m3uArray[i + 1],
    ]);
    i += 2;
  }

  let channelLines = '';
  for (let idx = 0; idx < channels.length; idx++) {
    const c = channels[idx];
    channelLines += `| ${idx + 1} | ${c[0].replace('|', '')} | ${c[1]} | <${c[2]}> |\n`;
  }

  const after = list
    .replace('<!-- list_title_here -->', `# List for **${name}**${rollback ? '(Rollback)' : ''}\n\n> M3U: [${f_name}.m3u](/${f_name}.m3u), TXT: [${f_name}.txt](/txt/${f_name}.txt)`)
    .replace('<!-- channels_here -->', `${channelLines}\n\nUpdated at **${new Date()}**`);

  const list_p = path.join(path.resolve(), 'm3u', 'list');
  if (!fs.existsSync(list_p)) {
    fs.mkdirSync(list_p);
  }
  fs.writeFileSync(path.join(list_p, `${f_name}.list.md`), after);
};

export const updateReadme = (
  sources: any[],
  sources_res: any[],
  epgs: any[] = [],
  epgs_res: any[] = []
) => {
  const readme_temp_p = path.join(path.resolve(), 'README.temp.md');
  const readme = fs.readFileSync(readme_temp_p, 'utf8').toString();

  let channelsTable = '';
  for (let idx = 0; idx < sources.length; idx++) {
    const  = sources[idx];
    const count = sources_res[idx] ? sources_res[idx][1] : 'update failed';
    const rollbackMark = sources_res[idx] && sources_res[idx][0] === 'rollback' ? '✅' : '-';
    channelsTable += `| ${.name} | [${.f_name}.m3u](/${.f_name}.m3u) <br> [${.f_name}.txt](/txt/${.f_name}.txt) | [List for ${.name}](/list/${.f_name}.list) | ${count} | ${rollbackMark} |\n`;
  }

  const after = readme
    .replace('<!-- channels_here -->', channelsTable)
    .replace('<!-- epgs_here -->', '\n> ⚠️ EPG 功能已禁用\n\nUpdated at **' + new Date().toString() + '**');

  if (!fs.existsSync(path.join(path.resolve(), 'm3u'))) {
    fs.mkdirSync(path.join(path.resolve(), 'm3u'));
  }
  fs.writeFileSync(path.join(path.resolve(), 'm3u', 'README.md'), after);
};

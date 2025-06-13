import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDebounceFn, useMount } from "ahooks";
import { isEmpty } from "lodash";
import classNames from "classnames";
import { Button, Input, InputNumber, Popover, Radio, Space } from "antd";
import './index.css';
import useLastExecParam from "@/hooks/useLastExecParam";

interface SelectFontProps {
    visible: boolean
    onChange: (params: Pick<ExecParam, 'font' | 'fontSizeDelta'>) => void
}

function SelectFont(
    {
        visible,
        onChange
    }: SelectFontProps
) {
    const [lastExecParam] = useLastExecParam();
    const onChangeRef = useRef(onChange);
    const fontListRef = useRef<HTMLDivElement>(null);
    const [keyword, setKeyword] = useState<string>();
    const [fonts, setFonts] = useState<string[]>([]);
    const [font, setFont] = useState<string>();
    const [fontSizeDelta, setFontSizeDelta] = useState<number>(0);

    useMount(() => {
        if (lastExecParam.font) {
            setFont(lastExecParam.font);
            onChangeRef.current({
                font: lastExecParam.font,
                fontSizeDelta,
            });
        }
    });

    const getInstalledFonts = useCallback(() => {
        setFont('');
        window.ipcRenderer.invoke('get-installed-fonts').then((res: string[]) => {
            if (!isEmpty(res)) {
                res.sort((a, b) => {
                    const isChineseA = /^[\u4E00-\u9FFF]/.test(a);
                    const isChineseB = /^[\u4E00-\u9FFF]/.test(b);
                    if (isChineseA && isChineseB) {
                        return a.localeCompare(b, 'zh');
                    }
                    if (!isChineseA && !isChineseB) {
                        return a.localeCompare(b, 'en', { sensitivity: 'base' });
                    }
                    return isChineseA ? -1 : 1;
                });
                setFonts(res);
            }
        });
    }, []);

    useMount(() => {
        getInstalledFonts();
    });

    const { run: scrollToFont } = useDebounceFn((keyword: string) => {
        const index = fonts.findIndex(f => f.includes(keyword.toLowerCase().trim()));
        if (index > -1) {
            const fontListItem = document.querySelector(`#font-list-item_${index}`);
            if (fontListItem) {
                fontListItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                if (fontListRef.current) {
                    fontListRef.current.scrollTo({ top: fontListRef.current.scrollTop - 14 })
                }
            }
        } else {
            if (fontListRef.current) {
                fontListRef.current.scrollTo({ top: -10 })
            }
        }
    }, { wait: 500 });

    const onKeywordChange = useCallback((keyword: string) => {
        setKeyword(keyword);
        scrollToFont(keyword);
    }, [scrollToFont]);

    useEffect(() => {
        if (onChangeRef.current) {
            onChangeRef.current({ font, fontSizeDelta });
        }
    }, [font, fontSizeDelta])

    return (
        <div className={classNames('select-font', { 'hidden': !visible })}>
            <div className="font-list-container">
                <Space>
                    <Input
                        placeholder="输入字体名称搜索"
                        value={keyword}
                        onChange={(e) => onKeywordChange(e.target.value)}
                        allowClear
                    />
                    <Button type="primary" onClick={() => getInstalledFonts()}>刷新列表</Button>
                </Space>
                <div className="font-list" ref={fontListRef}>
                    <Radio.Group value={font} onChange={e => setFont(e.target.value)}>
                        <Space direction="vertical">
                            {
                                fonts.map((font, index) => (
                                    <Radio
                                        key={font}
                                        className="font-list-item"
                                        id={`font-list-item_${index}`}
                                        style={{ fontFamily: font }}
                                        value={font}
                                    >
                                        {font}
                                    </Radio>
                                ))
                            }
                        </Space>
                    </Radio.Group>
                </div>
                <Space>
                    <span>字体大小调整：</span>
                    <InputNumber
                        value={fontSizeDelta}
                        min={-10}
                        max={10}
                        onChange={(value) => setFontSizeDelta(value || 0)}
                    />
                    <Popover
                        content={
                            <div>
                                <p>1. 可选字体为电脑已安装的字体，安装新字体后需要刷新列表才会显示</p>
                                <p>2. 字体大小调整会在游戏原有字体大小基础上加上或减去此数值，<br/>而非直接设置成此数值
                                </p>
                            </div>
                        }
                        trigger="hover"
                        placement="top"
                    >
                        <Button type="link">说明</Button>
                    </Popover>
                </Space>
            </div>
            <div className="font-preview-container">
                {isEmpty(font) ? (
                    <div className="font-preview-hint">请在左侧字体列表中选择心仪的字体</div>
                ) : (
                    <div className="unique-item" style={font ? { fontFamily: font } : {}}>
                        <div className="unique-item-header">
                            <div className="item-name">法师之血</div>
                            <div className="item-name">重革腰带</div>
                        </div>
                        <div className="unique-item-content">
                            <div>腰带</div>
                            <div className="unique-item-content-seperator"/>
                            <div>需求 等级 <span className="color-white">44</span></div>
                            <div className="unique-item-content-seperator"/>
                            <div><span className="color-white">+35</span> 力量</div>
                            <div className="unique-item-content-seperator"/>
                            <div><span className="color-white">+50</span> 敏捷</div>
                            <div><span className="color-white">+25</span><span className="color-magic">% 火焰抗性</span>
                            </div>
                            <div><span className="color-white">+25</span><span className="color-magic">% 冰霜抗性</span>
                            </div>
                            <div><span className="color-magic">不能使用魔法非恢复类药剂</span></div>
                            <div><span className="color-magic">最左边的 <span className="color-white">4</span> 个魔法非恢复类药剂给你持续提供药剂效果</span>
                            </div>
                            <div><span className="color-magic">不能移除魔法非恢复类药剂效果</span></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SelectFont;
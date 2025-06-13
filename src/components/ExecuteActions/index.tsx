import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { Button, message, Modal } from "antd";
import classNames from "classnames";
import { isEmpty } from "lodash";
import './index.css';
import useLastExecParam from "@/hooks/useLastExecParam";

interface ExecuteActionsProps {
    visible: boolean
    onExecutingChange: (executing: boolean) => void
}

export interface ExecuteActionsHandler {
    execute: (execParam: ExecParam) => void
}

const ExecuteActions = forwardRef<ExecuteActionsHandler, ExecuteActionsProps>((
    {
        visible,
        onExecutingChange,
    },
    ref
) => {
    const [, setLastExecParam] = useLastExecParam();
    const [executeLog, setExecuteLog] = useState<string>('');

    useEffect(() => {
        const listener = (event: any, data: string) => {
            setExecuteLog(prev => prev + data + '\n');
        };
        window.ipcRenderer.on('execute-log', listener);
        return () => {
            window.ipcRenderer.off('execute-log', listener);
        }
    }, [])

    useImperativeHandle<ExecuteActionsHandler, ExecuteActionsHandler>(ref, (): ExecuteActionsHandler => ({
        execute: (execParam: ExecParam) => {
            const { patch, font, fontSizeDelta, removeMinimapFog, cameraZoom } = execParam;
            if (isEmpty(patch) && isEmpty(font) && !fontSizeDelta && removeMinimapFog === undefined && cameraZoom === undefined) {
                message.error('当前没有配置任何可以执行的内容').then();
                return;
            }
            Modal.confirm({
                title: '确认执行',
                content: '开始执行后请等待执行结果，提前关闭本工具可能导致游戏客户端损坏',
                okText: '确认',
                cancelText: '取消',
                onOk: () => {
                    onExecutingChange(true);
                    window.ipcRenderer.invoke('patch', execParam).then(code => {
                        setLastExecParam(execParam);
                        if (code === 0) {
                            message.success('执行成功').then();
                        } else {
                            message.error('执行失败').then()
                        }
                        onExecutingChange(false);
                    });
                }
            })
        }
    }), [])

    const openGithub = useCallback(() => {
        window.ipcRenderer.invoke('open-external', 'https://github.com/sage9731/poe-crafting-bench');
    }, []);

    return (
        <div className={classNames('execute-actions', { 'hidden': !visible })}>
            <div className="disclaimer">
                <div className="disclaimer-title">免责声明</div>
                <div className="disclaimer-content">
                    <div>1. 本工具开源免费，<a onClick={openGithub}>开源地址</a></div>
                    <div>2. 任何修改游戏本体的操作都有可能导致封号，由此造成的后果请自行承担</div>
                    <div>3. 本工具不包含任何恶意行为，例如窃取账号信息、盗号等。不放心的朋友可以阅读源码确认安全后自行编译打包使用
                    </div>
                    <div>4. 如果执行后，遇到Content.ggpk/_.index.bin损坏，可以切到选择游戏目录步骤，使用右下角的修补功能
                    </div>
                    <div>5. 继续使用本工具代表同意此声明</div>
                </div>
            </div>
            <div className="execute-result">
                <div className="execute-result-title">
                    <span>日志</span>
                    <Button type="link">复制</Button>
                </div>
                <div className="execute-log">{executeLog}</div>
            </div>
        </div>
    );
});

export default ExecuteActions;
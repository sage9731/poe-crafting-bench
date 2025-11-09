import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
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
    const logRef = useRef<HTMLDivElement>(null);
    const [, setLastExecParam] = useLastExecParam();
    const [executeLog, setExecuteLog] = useState<string>('');

    useEffect(() => {
        const listener = (event: any, data: string) => {
            setExecuteLog(prev => prev + data.trim() + '\n');
            setTimeout(() => {
                if (logRef.current) {
                    logRef.current.scrollTop = logRef.current.scrollHeight;
                }
            }, 100);
        };
        window.ipcRenderer.on('execute-log', listener);
        return () => {
            window.ipcRenderer.off('execute-log', listener);
        }
    }, [])

    useImperativeHandle<ExecuteActionsHandler, ExecuteActionsHandler>(ref, (): ExecuteActionsHandler => ({
        execute: (execParam: ExecParam) => {
            const { patch, font, fontSizeDelta, minimapVisibility, cameraZoom } = execParam;
            if (isEmpty(patch) && isEmpty(font) && !fontSizeDelta && minimapVisibility === undefined && cameraZoom === undefined) {
                message.error('当前没有配置任何可以执行的内容').then();
                return;
            }
            Modal.confirm({
                title: '确认执行',
                content: (
                    <div>
                        <p>1. 请确认游戏客户端和其他可能读取游戏文件的工具已关闭</p>
                        <p>2. 开始执行后请耐心等待执行结果，提前关闭本工具可能导致游戏客户端损坏</p>
                    </div>
                ),
                okText: '继续',
                cancelText: '取消',
                onOk: () => {
                    onExecutingChange(true);
                    setExecuteLog('');
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
                    <div>1. 此工具开源免费，<a onClick={openGithub}>开源地址</a></div>
                    <div>2. 任何修改游戏本体的操作都有可能导致封号，由此造成的后果请自行承担</div>
                    <div>3. 此工具不包含任何恶意行为，例如窃取账号信息、盗号等。不放心的朋友可以阅读源码确认安全后自行编译打包使用
                    </div>
                    <div>4. 每次游戏更新后补丁和字体等修改都会失效，需要下载新版本补丁安装。</div>
                    <div>5. 继续使用此工具代表同意声明</div>
                </div>
            </div>
            <div className="execute-result">
                <div className="execute-result-title">
                    <span>执行日志</span>
                </div>
                <div className="execute-log" ref={logRef}>{executeLog}</div>
            </div>
        </div>
    );
});

export default ExecuteActions;
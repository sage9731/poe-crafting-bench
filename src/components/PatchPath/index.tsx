import React, { DragEvent, useCallback, useRef, useState } from 'react';
import classNames from "classnames";
import './index.css';
import { InboxOutlined } from "@ant-design/icons";
import { isEmpty, uniq } from "lodash";

interface PatchPathProps {
    visible: boolean
    onChange: (patchPaths: string[]) => void
}

function PatchPath(
    {
        visible,
        onChange,
    }: PatchPathProps
) {
    const [paths, setPaths] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false)
    const dragCounter = useRef<number>(0);

    const onDropAreaClick = useCallback(() => {
        window.ipcRenderer.invoke('open-patch-file-dialog').then(paths => {
            if (!isEmpty(paths)) {
                setPaths(prev => uniq([...prev, ...paths]));
            }
        });
    }, []);

    const onDragEnter = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;

        // 检查是否为文件拖拽
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    }, []);

    const onDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;

        // 当拖拽离开整个区域时取消激活状态
        if (dragCounter.current === 0) {
            setIsDragging(false);
        }
    }, []);

    const onDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        if (!isDragging && e.dataTransfer.types.includes('Files')) {
            setIsDragging(true);
        }
    }, []);

    const onDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length) {
            const filesArray = Array.from(droppedFiles);
            console.log(filesArray)
            const paths = filesArray.map(file => window.ipcRenderer.getFilePath(file)).filter(path => path.toLowerCase().endsWith('.zip'));
            setPaths(prev => uniq([...prev, ...paths]));
        }
    }, []);

    return (
        <div className={classNames('patch-path', { 'hidden': !visible })}>
            <div
                className={classNames('patch-drop-area', { 'patch-drop-area--highlight': isDragging })}
                onClick={onDropAreaClick}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDragOver={onDragOver}
                onDrop={onDrop}
            >
                <div className="patch-drop-area-icon">
                    <InboxOutlined/>
                </div>
                <div className="patch-drop-area-text">
                    点击 或 拖放压缩包到 此区域来添加待安装补丁
                </div>
                <div className="patch-drop-area-hint">
                    <p>支持一个或多个补丁安装</p>
                    <p>若同时安装多个补丁，请在右侧调整补丁安装顺序</p>
                    <p>一般来说，功能补丁需要放在第一位，其他补丁随意</p>
                </div>
            </div>
            <div className="patch-list">
                {JSON.stringify(paths)}
            </div>
        </div>
    );
}

export default PatchPath;
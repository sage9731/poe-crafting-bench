import React, { useCallback, useState } from 'react';
import classNames from "classnames";
import { Button, Flex, Input, Tooltip } from "antd";
import WeGameIcon from '../../assets/wegame.png';
import GggIcon from '../../assets/ggg.png';
import SteamIcon from '../../assets/steam.ico';
import EpicIcon from '../../assets/Epic.ico';
import PathOfExile1Icon from '../../assets/PathOfExile1.ico';
import PathOfExile2Icon from '../../assets/PathOfExile2.ico';
import './index.css';

interface GameInstallPathProps {
    visible: boolean
    onChange: (gameInstallPath: string) => void
}

const gameVersions = [
    {
        value: 1,
        label: '流放之路',
        icon: PathOfExile1Icon,
    },
    {
        value: 2,
        label: '流放之路:降临',
        icon: PathOfExile2Icon,
    }
]

const gamePlatforms = [
    {
        value: 'TENCENT',
        label: '腾讯',
        icon: WeGameIcon,
        supported: true,
    },
    {
        value: 'GGG',
        label: '国际服官网',
        icon: GggIcon,
        supported: true,
    },
    {
        value: 'Steam',
        label: 'Steam',
        icon: SteamIcon,
        supported: false,
    },
    {
        value: 'Epic',
        label: 'Epic',
        icon: EpicIcon,
        supported: false,
    }
]

function GameInstallPath(
    {
        visible = false,
        onChange,
    }: GameInstallPathProps
) {
    const [gameInstallPath, setGameInstallPath] = useState<string>();
    const [version, setVersion] = useState<number>();
    const [gamePlatform, setGamePlatform] = useState<string>();

    const onManualChoose = useCallback(() => {
        window.ipcRenderer.invoke('open-game-file-dialog').then(res => {
            setGameInstallPath(res);
        })
    }, []);

    return (
        <div className={classNames("game-install-path", { 'hidden': !visible })}>
            <Flex gap={12} align="center">
                <Flex flex={1}>
                    <Input
                        value={gameInstallPath}
                        onChange={(e) => setGameInstallPath(e.target.value)}
                        placeholder="请选择游戏根目录 Content.ggpk 或 Bundles2\_.index.bin"
                    />
                </Flex>
                <Button type="primary" onClick={onManualChoose}>手动选择</Button>
            </Flex>
            <div className="game-install-path-tip">自动检测游戏安装目录：</div>
            <div className="game-client-list">
                {
                    gameVersions.map(({ label, value, icon }) => (
                        <div
                            key={value}
                            className={classNames('game-client-list-item', {
                                'game-client-list-item--active': value === version
                            })}
                            onClick={() => setVersion(value)}
                        >
                            <Tooltip title={label}>
                                <img src={icon} alt="" title={label}/>
                            </Tooltip>
                        </div>
                    ))
                }
                <div className="divider"/>
                {
                    gamePlatforms.map(({ label, value, icon, supported }) => (
                        <div
                            key={value}
                            className={classNames("game-client-list-item", {
                                "game-client-list-item--active": value === gamePlatform,
                                "game-client-list-item--disable": !supported
                            })}
                            onClick={() => supported && setGamePlatform(value)}
                        >
                            <Tooltip title={supported ? label : '暂不支持自动检测该平台的游戏安装目录，请手动选择'}>
                                <img src={icon} alt=""/>
                            </Tooltip>
                        </div>
                    ))
                }
            </div>
        </div>
    );
}

export default GameInstallPath;
import './App.css'
import { Button, Steps, message } from "antd";
import { FileZipOutlined, FolderOpenOutlined, FontSizeOutlined, RocketOutlined, SunOutlined } from "@ant-design/icons";
import { useCallback, useMemo, useState } from "react";
import { StepProps } from "antd/es/steps";
import GameInstallPath from "@/components/GameInstallPath";
import { useLocalStorageState } from "ahooks";
import PatchPath from "@/components/PatchPath";
import { isEmpty } from 'lodash';

interface CustomStepProps extends StepProps {
    key: 'path' | 'patch' | 'font' | 'enhance' | 'execute'
}

function App() {
    const [execParam, setExecParam] = useState<ExecParam>({ path: '' });
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [secretClickTimes, setSecretClickTimes] = useState(0);
    const [enhanceEnabled, setEnhanceEnabled] = useLocalStorageState<boolean>('enhanceEnabled', {
        defaultValue: false,
        serializer: value => value.toString(),
        deserializer: value => value === 'true',
    });
    const steps: CustomStepProps[] = useMemo(() => {
        const steps: CustomStepProps[] = [
            {
                key: 'path',
                title: '选择游戏目录',
                icon: <FolderOpenOutlined/>
            },
            {
                key: 'patch',
                title: '选择补丁',
                icon: <FileZipOutlined/>,
            },
            {
                key: 'font',
                title: '选择字体',
                icon: <FontSizeOutlined/>,
            }
        ];
        if (enhanceEnabled) {
            steps.push({
                key: 'enhance',
                title: '更多功能',
                icon: <SunOutlined/>
            });
        }
        steps.push({
            key: 'execute',
            title: '执行',
            icon: <RocketOutlined/>
        });
        return steps;
    }, [enhanceEnabled]);

    const currentStepKey = steps[currentStep].key;

    const onStepChange = useCallback((step: number) => {
        setCurrentStep(step);
    }, []);

    const onNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    }

    const onSecretClick = useCallback(() => {
        if (!enhanceEnabled) {
            const times = secretClickTimes + 1;
            if (times < 10) {
                setSecretClickTimes(times);
                if (times >= 5) {
                    message.success({
                        key: 'secret-click-times',
                        content: `还差 ${10 - times} 次开启更多功能！`
                    }).then();
                }
            } else {
                message.success({
                    key: 'secret-click-times',
                    content: '已开启更多功能！'
                }).then();
                setEnhanceEnabled(true);
            }
        }
    }, [enhanceEnabled, secretClickTimes]);

    const setExecParamField = useCallback((key: string, value: any) => {
        setExecParam(prev => ({
            ...prev,
            [key]: value,
        }))
    }, []);

    return (
        <div className='App'>
            <div className="header">
                <Steps
                    current={currentStep}
                    items={steps}
                    responsive={false}
                />
            </div>
            <div className="body">
                <GameInstallPath
                    visible={currentStepKey === 'path'}
                    onChange={path => setExecParamField('path', path)}
                />
                <PatchPath
                    visible={currentStepKey === 'patch'}
                    onChange={patch => setExecParamField('patch', patch)}
                />
            </div>
            <div className="footer">
                <Button
                    disabled={currentStep === 0}
                    onClick={() => setCurrentStep(prev => prev - 1)}
                >
                    上一步
                </Button>
                <div className="secret" onClick={onSecretClick}>你的血管里奔流着力量之河。</div>
                <Button
                    type="primary"
                    onClick={onNext}
                    disabled={currentStepKey === 'path' && isEmpty(execParam.path)}
                >
                    {currentStep <= steps.length - 2 ? '下一步' : '执行'}
                </Button>
            </div>
        </div>
    )
}

export default App
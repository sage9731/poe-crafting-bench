import React, { useCallback } from 'react';
import { Alert, Flex, Form, Radio, Slider, Switch } from "antd";
import classNames from "classnames";
import './index.css';

interface HiddenFeaturesProps {
    visible: boolean
    onChange: (params: Pick<ExecParam, 'removeMinimapFog' | 'cameraZoom'>) => void
}

function HiddenFeatures(
    {
        visible,
        onChange,
    }: HiddenFeaturesProps
) {
    const [form] = Form.useForm();
    const enableRemoveMinimapFog = Form.useWatch('enableRemoveMinimapFog', form);
    const enableCameraZoom = Form.useWatch('enableCameraZoom', form);
    const cameraZoom = Form.useWatch('cameraZoom', form);

    const onValuesChange = useCallback((changedValues: any, values: any) => {
        const { enableRemoveMinimapFog, removeMinimapFog, enableCameraZoom, cameraZoom } = values;
        onChange({
            removeMinimapFog: enableRemoveMinimapFog ? removeMinimapFog : undefined,
            cameraZoom: enableCameraZoom ? cameraZoom : undefined,
        })
    }, [onChange]);

    return (
        <div className={classNames('hidden-features', { 'hidden': !visible })}>
            <Alert
                className="hidden-features-hint"
                type="warning"
                message="请勿传播开启更多功能的方法，这些功能容易引起争议，导致本工具不复存在。"
            />
            <Alert
                className="hidden-features-hint"
                type="error"
                message="以下功能请谨慎开启，有被封号的风险，后果自行承担！如果不想使用这些功能，请将开关拨至保持原样。"
            />
            <Form
                form={form}
                initialValues={{
                    enableRemoveMinimapFog: false,
                    removeMinimapFog: true,
                    enableCameraZoom: false,
                    cameraZoom: 1
                }}
                onValuesChange={onValuesChange}
            >
                <Form.Item
                    name="removeMinimapFog"
                    label="小地图全开"
                >
                    <Flex gap={16} align="center">
                        <Form.Item name="enableRemoveMinimapFog" noStyle>
                            <Switch checkedChildren="无视风险" unCheckedChildren="保持原样"/>
                        </Form.Item>
                        {
                            enableRemoveMinimapFog && (
                                <Form.Item name="removeMinimapFog" noStyle>
                                    <Radio.Group>
                                        <Radio value={true}>启用</Radio>
                                        <Radio value={false}>禁用</Radio>
                                    </Radio.Group>
                                </Form.Item>
                            )
                        }
                    </Flex>

                </Form.Item>
                <Form.Item
                    label="视距倍数"
                >
                    <Flex gap={8} align="center">
                        <Form.Item name="enableCameraZoom" noStyle>
                            <Switch checkedChildren="无视风险" unCheckedChildren="保持原样"/>
                        </Form.Item>
                        {
                            enableCameraZoom && (
                                <>
                                    <Form.Item name="cameraZoom" noStyle>
                                        <Slider style={{ width: 300 }} min={1} max={3} step={0.1}/>
                                    </Form.Item>
                                    <span>{cameraZoom}倍</span>
                                </>
                            )
                        }
                    </Flex>
                </Form.Item>
            </Form>
        </div>
    );
}

export default HiddenFeatures;
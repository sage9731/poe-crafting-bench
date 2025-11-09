// ToggleableFeature.tsx
import React from 'react';
import { Flex, Form, Switch } from 'antd';

interface ToggleableFeatureProps {
    label: string; // 功能标签，如“小地图全开”
    enableFieldName: string; // 控制启用/禁用的表单字段名，如 "enableMinimapVisibility"
    children: React.ReactNode; // 当开关开启时渲染的子组件
}

const ToggleableFeature: React.FC<ToggleableFeatureProps> = ({
                                                                 label,
                                                                 enableFieldName,
                                                                 children
                                                             }) => {
    const enabled = Form.useWatch(enableFieldName); // 监听启用状态

    return (
        <Form.Item label={label}>
            <Flex gap={16} align="center">
                <Form.Item name={enableFieldName} noStyle>
                    <Switch checkedChildren="无视风险" unCheckedChildren="保持原样" />
                </Form.Item>
                {enabled && children}
            </Flex>
        </Form.Item>
    );
};

export default ToggleableFeature;
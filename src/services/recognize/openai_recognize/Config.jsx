import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';
import { Button, Input } from '@nextui-org/react';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/api/shell';
import React, { useState } from 'react';

import { useConfig } from '../../../hooks/useConfig';
import { useToastStyle } from '../../../hooks';
import { recognize } from './index';

export function Config(props) {
    const [isLoading, setIsLoading] = useState(false);
    const { instanceKey, updateServiceList, onClose } = props;
    const { t } = useTranslation();
    const [config, setConfig] = useConfig(
        instanceKey,
        {
            [INSTANCE_NAME_CONFIG_KEY]: 'OpenAI Compatible',
            requestPath: 'https://api.openai.com',
            apiKey: '',
            model: 'gpt-4o',
            customPrompt: "Just recognize the text in the image. Do not offer unnecessary explanations."
        },
        { sync: false }
    );

    const toastStyle = useToastStyle();

    return (
        config !== null && (
            <>
                <Toaster />
                <div className='config-item'>
                    <Input
                        label={t('services.instance_name')}
                        labelPlacement='outside-left'
                        value={config[INSTANCE_NAME_CONFIG_KEY]}
                        variant='bordered'
                        onValueChange={(value) => {
                            setConfig({
                                ...config,
                                [INSTANCE_NAME_CONFIG_KEY]: value,
                            });
                        }}
                    />
                </div>
                 <div className={'config-item'}>
                    <h3 className='my-auto'>API Key</h3>
                    <Input
                        type='password'
                        value={config['apiKey']}
                        variant='bordered'
                        className='max-w-[50%]'
                        onValueChange={(value) => {
                            setConfig({
                                ...config,
                                apiKey: value,
                            });
                        }}
                    />
                </div>
                <div className={'config-item'}>
                    <h3 className='my-auto'>Request Path</h3>
                    <Input
                        value={config['requestPath']}
                        variant='bordered'
                        className='max-w-[50%]'
                        onValueChange={(value) => {
                            setConfig({
                                ...config,
                                requestPath: value,
                            });
                        }}
                    />
                </div>
                 <div className={'config-item'}>
                    <h3 className='my-auto'>Model</h3>
                    <Input
                        value={config['model']}
                        variant='bordered'
                        className='max-w-[50%]'
                        onValueChange={(value) => {
                            setConfig({
                                ...config,
                                model: value,
                            });
                        }}
                    />
                </div>
                 <div className={'config-item'}>
                    <h3 className='my-auto'>Custom Prompt</h3>
                    <Input
                        value={config['customPrompt']}
                        variant='bordered'
                        className='max-w-[50%]'
                        onValueChange={(value) => {
                            setConfig({
                                ...config,
                                customPrompt: value,
                            });
                        }}
                    />
                </div>
                <div>
                    <Button
                        isLoading={isLoading}
                        fullWidth
                        color='primary'
                        onPress={() => {
                            setIsLoading(true);
                            setConfig(config, true);
                            updateServiceList(instanceKey);
                            onClose();
                            setIsLoading(false);
                            // Test logic omitted for brevity as recognize requires image
                        }}
                    >
                        {t('common.save')}
                    </Button>
                </div>
            </>
        )
    );
}

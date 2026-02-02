import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';
import { Button, Input, Select, SelectItem } from '@nextui-org/react';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/api/shell';
import React, { useState } from 'react';

import { useConfig } from '../../../hooks/useConfig';
import { useToastStyle } from '../../../hooks';
import { tts, Language } from './index';

export function Config(props) {
    const [isLoading, setIsLoading] = useState(false);
    const { instanceKey, updateServiceList, onClose } = props;
    const { t } = useTranslation();
    const [config, setConfig] = useConfig(
        instanceKey,
        {
            [INSTANCE_NAME_CONFIG_KEY]: 'OpenAI TTS',
            requestPath: 'https://api.openai.com',
            apiKey: '',
            model: 'tts-1',
            voice: 'alloy',
            speed: 1.0,
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
                    <h3 className='my-auto'>Voice</h3>
                    <Input
                        value={config['voice']}
                        variant='bordered'
                        className='max-w-[50%]'
                        onValueChange={(value) => {
                            setConfig({
                                ...config,
                                voice: value,
                            });
                        }}
                    />
                </div>
                 <div className={'config-item'}>
                    <h3 className='my-auto'>Speed</h3>
                    <Select
                        className='max-w-[50%]'
                        defaultSelectedKeys={[config['speed'].toString()]}
                        variant="bordered"
                        onChange={(e) => {
                            setConfig({
                                ...config,
                                speed: parseFloat(e.target.value),
                            });
                        }}
                    >
                        <SelectItem key="0.25" value={0.25}>0.25</SelectItem>
                        <SelectItem key="0.5" value={0.5}>0.5</SelectItem>
                        <SelectItem key="0.75" value={0.75}>0.75</SelectItem>
                        <SelectItem key="1" value={1}>1.0</SelectItem>
                        <SelectItem key="1.25" value={1.25}>1.25</SelectItem>
                        <SelectItem key="1.5" value={1.5}>1.5</SelectItem>
                        <SelectItem key="2" value={2}>2.0</SelectItem>
                        <SelectItem key="3" value={3}>3.0</SelectItem>
                        <SelectItem key="4" value={4}>4.0</SelectItem>
                    </Select>
                </div>
                <div>
                    <Button
                        isLoading={isLoading}
                        fullWidth
                        color='primary'
                        onPress={() => {
                            setIsLoading(true);
                             // Test logic, ideally call tts with streaming false or handle stream
                            tts('Hello', Language.en, { config: config,
                                onData: () => {} // Dummy callback, we just check if it resolves or throws
                             }).then(
                                () => {
                                    setIsLoading(false);
                                    setConfig(config, true);
                                    updateServiceList(instanceKey);
                                    onClose();
                                },
                                (e) => {
                                    setIsLoading(false);
                                    toast.error(t('config.service.test_failed') + e.toString(), { style: toastStyle });
                                }
                            );
                        }}
                    >
                        {t('common.save')}
                    </Button>
                </div>
            </>
        )
    );
}

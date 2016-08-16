package com.guogai.wxhelloworld;

import android.app.Application;

import com.taobao.weex.InitConfig;
import com.taobao.weex.WXSDKEngine;

/**
 * Created by guogai on 2016/8/16.
 */
public class HelloWorldApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        //初始化WXSDK
        InitConfig config = new InitConfig.Builder().setImgAdapter(new ImageAdapter()).build();
        WXSDKEngine.initialize(this, config);
    }
}

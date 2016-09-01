package com.guogai.sample;

import android.app.Application;

import com.guogai.sample.adapter.ImageAdapter;
import com.taobao.weex.InitConfig;
import com.taobao.weex.WXSDKEngine;

/**
 * Created by guogai on 2016/8/31.
 */
public class WeexSampleApplication extends Application {

    private static WeexSampleApplication weexSampleApplication = null;

    @Override
    public void onCreate() {
        super.onCreate();
        weexSampleApplication = this;
        //初始化WXSDK
        InitConfig config = new InitConfig.Builder().setImgAdapter(new ImageAdapter()).build();
        WXSDKEngine.initialize(this, config);
    }

    public static WeexSampleApplication getMyApplication() {
        return weexSampleApplication;
    }

}

package com.guogai.sample.adapter;

import android.widget.ImageView;

import com.guogai.sample.WeexSampleApplication;
import com.squareup.picasso.Picasso;
import com.taobao.weex.adapter.IWXImgLoaderAdapter;
import com.taobao.weex.common.WXImageStrategy;
import com.taobao.weex.dom.WXImageQuality;

/**
 * Created by guogai on 2016/8/16.
 */
public class ImageAdapter implements IWXImgLoaderAdapter {
    @Override
    public void setImage(String url, ImageView view, WXImageQuality quality, WXImageStrategy strategy) {
        //实现自己的图片下载，否则图片无法显示。
        Picasso.with(WeexSampleApplication.getMyApplication()).load(url).into(view);
    }
}

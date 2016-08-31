package com.guogai.sample.activity;

import android.content.Intent;
import android.os.Bundle;
import android.os.PersistableBundle;
import android.support.annotation.Nullable;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.widget.ListView;

import com.guogai.sample.R;
import com.joanzapata.android.BaseAdapterHelper;
import com.joanzapata.android.QuickAdapter;

import java.util.ArrayList;
import java.util.Arrays;

/**
 * Created by guogai on 2016/8/31.
 */
public class SampleListActivity extends AppCompatActivity {
    private ListView mLvList;
    private QuickAdapter<String> mAdapterList;
    private ArrayList<String> mListSample = new ArrayList<>();

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_sample_list);
        initViews();
        setViewDatas();
    }

    private void initViews() {
        mLvList = (ListView) findViewById(R.id.lv_sample_list);
        mAdapterList = new QuickAdapter<String>(getApplicationContext(), R.layout.list_sample_list_item) {
            @Override
            protected void convert(final BaseAdapterHelper helper, String item) {
                helper.setText(R.id.tv_sample_list_item, item)
                        .setOnClickListener(R.id.tv_sample_list_item, new View.OnClickListener() {
                            @Override
                            public void onClick(View v) {
                                switch (helper.getPosition()) {
                                    case 0:
                                        Intent intent = new Intent(SampleListActivity.this, ImageActivity.class);
                                        startActivity(intent);
                                        break;
                                }
                            }
                        });
            }
        };
        mLvList.setAdapter(mAdapterList);
    }

    private void setViewDatas() {
        mListSample.addAll(Arrays.asList("image标签"));
        mAdapterList.addAll(mListSample);
        mAdapterList.notifyDataSetChanged();
    }

}

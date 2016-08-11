## 第2篇 了解Weex源码结构，修改example         
其实，前面一节，我们发现，写一个简单的带有样式的界面还是挺简单的。这一节，我们不学习如何去了解一个工程，我们去学习了解官方的github代码库。一方面，可以让大家体验修改Demo的乐趣，同时可以大家可以直观的了解一个开源代码库的结构。         

## 1. 下载Weex源码     
首先，你得安装了git。至于如何安装git，可以google/baidu了。Mac OSX的同学可以使用brew命令安装。如果没有brew，请先安装homebrew。    
这里，就当作大家git 命令和基础知识已经准备妥当。        

打开：https://github.com/alibaba/weex 网站，就可以看到weex的源码。我们使用git克隆代码到本地：         

	$ git clone https://github.com/alibaba/weex.git    
	
## 2.了解源码结构        
代码下载完成了，那么我们看一下源码的目录结构。  
![](imgs/002_1.png)      

这里说几个比较重要的目录和文件：  
     
+ package.json :	node_modules依赖，更重要的是里面包含了npm run xxx 等快捷命令。比如之前我们运行node.js程序是这样的：$ node xx.js。这里我们可以把它配置化，例如package.json文件中的：        
![](imgs/002_2.png)               

+ start文件: 启动程序文件，里面包换编译和启动脚本：      

		#called by native   
		THIS_DIR=$(dirname "$0")
		pushd "$THIS_DIR"

		npm run build:native
		npm run build:browser
		npm run serve &
		npm run dev:examples

		popd

其中npm run就是执行package.json中的定义好的脚本别名。          

+ examples: 示例Demo      
+ android/ios/html： 各平台代码   
+ build：打包各平台的脚本，配置在package.json中。         

## 3.跑起程序          

以下摘录weex github仓库README.md，按照下面步骤即可跑起来。     

### Android 

0. Prerequisites
    0. Install [Node.js](http://nodejs.org/) 4.0+
    0. Under project root 
        0. `npm install`, install project 
        0. `./start`
    0. Install [Android Environment](http://developer.android.com/training/basics/firstapp/index.html)
0. Run playground, In Android Studio
    0. Open `android/playground`
    0. In `app/java/com.alibaba.weex/IndexActivity`, modify `CURRENT_IP` to your local IP
    0. Click <img src="http://gtms04.alicdn.com/tps/i4/TB1wCcqMpXXXXakXpXX3G7tGXXX-34-44.png" height="16" > (`Run` button)
0. [Add an example](./examples/README.md#add-an-example)


#### Runtime

On Android Platform , Weex code is executed in [weex_v8core](https://github.com/alibaba/weex_v8core) which is based on Google V8 JavaScript engine.

### iOS

0. Prerequisites
	0. Install [Node.js](http://nodejs.org/) 4.0+
    0. Under project root 
        0. `npm install`, install project 
        0. `./start`
    0. Install [iOS Environment](https://developer.apple.com/library/ios/documentation/IDEs/Conceptual/AppStoreDistributionTutorial/Setup/Setup.html)
    0. Install [CocoaPods](https://guides.cocoapods.org/using/getting-started.html)
0. Run playground
    0. `cd ios/playground`
    0. `pod install`
    0. Open `WeexDemo.xcworkspace` in Xcode
    0. Click <img src="http://img1.tbcdn.cn/L1/461/1/5470b677a2f2eaaecf412cc55eeae062dbc275f9" height="16" > (`Run` button) or use default shortcut `cmd + r` in Xcode
    0. If you want to run the demo on your device. In `DemoDefine.h`(you can search this file by Xcode default shortcut `cmd + shift + o`), modify `CURRENT_IP` to your local IP
 
运行的结果，如下图：             
![](imgs/002_3.png)        
但是，我们也希望在浏览器中看到效果，那么输入如下网站也可：     

	http://127.0.0.1:12580        
    
## 4.修改example            
![](imgs/002_4.png)            
其中index.we是入口文件。因此可以在example中增加一个文件。然后在index.we中增加一个name和title。          
![](imgs/002_5.png)         

点击模拟器刷新按钮即可查看效果。      
 

## 5.如何学习       
到这里基本上已经可以修改个钟demo，查看各种效果。当不了解一个组件和api如何使用时，查阅官方文档和阅读Demo就显得尤为重要。              
     
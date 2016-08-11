## 第1篇 weex初体验    
很多话题已展开就是一本百科全书，但是，很多时候，直观、精简的方式是大家容易接受的。比如初学者学习V系的语言，拿着微软的MSDN是无从下手的。因此，我在尝试简短去描述或者介绍一个事物。这个也是我个人必须去抽象和提升的。             

## Weex是什么？
Weex是阿里开源的一套构建跨平台的移动框架。对于前端的同学，最直观的是web components的开发方式；对于Native同学，可以理解为使用web的开发方式构建跨平台移动程序（iOS & Android）。可以类比的是React Native，但是相对React Native更为彻底：不仅统一了 iOS/Android的差异，更是实现了三端的统一。2016年，weex值得去关注，因为目前移动端的痛点是需要被攻克的难题。而这一块也是大家孜孜不倦的努力探索的结果。           
Weex更多细节参考： http://alibaba.github.io/weex/index.html。    

## Hello world    
现在的开发方式，不像以前我们直接1个html文件就可以的。任何工程化的体系都有相配套的工具。因此，面对安装工具，我们第一个心态应该是平静，秉着一颗提高效率的心情来使用。            

### 第0步：安装Node.js    
如何安装，这里不赘述了，可以直接到Node.js官网下载安装。安装Node.js的同时会帮助我们安装好npm。 初步安装的同学可以使用:  

```bash   
$ node -v
v6.3.1
$ npm -v
3.10.3
```	
node -v 和 npm -v 命令来测试Node.js环境是否搭建成功。	
### 第1步：安装weex-toolkit      
这里使用npm来完成。因为npm之前已经安装好了。所以，直接拿来使用即可。      

```bash
$ npm install -g weex-toolkit    
```	  
	
如果发现很慢，说明是时候考虑使用cnpm来安装了。首先，我们全局安装cnpm：     

```bash
$ npm install -g cnpm 	       
```
		
cnpm是一个国内npm镜像，可以提高下载速度。我们使用cnpm：     

```bash
$ cnpm install -g weex-toolkit      
``` 

**备注：** 当然，可能会提示权限问题，这时候加上``sudo``关键字即可。例如：  
 
```bash 
$ sudo npm install -g weex-toolkit 	   
```

 然后输入你本机电脑密码即可。       
 
 weex-toolkit安装完成后，输入:
 
```bash 	
 $ weex --version    
 info 0.4.4 
```
             
说明，我们安装成功。               


### 第2步：创建文件     
weex程序的文件后缀（扩展名）是.we。因此我们创建一个.we的文件。Mac OSX的同学，可以使用touch命令创建文件。      

```bash	
$ touch hello.we       
```

我们打开空白的hello.we文件，输入三个标签，内容为：       
 
```html
<template></template>
<style></style>
<script></script>      
```	
	
其实，这个时候，我们的程序完成了，就是这么简单粗暴。开发完成了，这段代码是不能直接跑的。我们都知道.html是可以直接运行的，这个程序呢，缺少了html的载体，同时只是xml的子集。那么，我们就需要使用weex-toolkit来编译我们的代码了。这里，使用weex命令编译hello.we文件。              

```bash
$ weex hello.we       
```	
	 
这时，会发现浏览器被打开了，浏览器地址是：        

``http://127.0.0.1:8081/weex_tmp/h5_render/?hot-reload_controller&page=hello.js&loader=xhr``          

这是浏览器是空白的，因为我们没有添加任何实质的内容。          

### 第3步：添加内容     
我们修改weex.we文件，像 hello.we 的 template 添加内容。 weex.we文件内容如下：        

```html
<template>
  <div>
	<text>Hello world</text>
  </div>
</template>
<style></style>
<script></script>       
```	
	 
我们再次编译hello.we文件：    

```bash
$ weex hello.we       
```	

OK，我们会看到浏览器显示了：Hello world字样。        

### 第5步：增加样式       
 我们给text增加样式，具体代码如下：           

```html 
<template>
	<div>
		<text class="text" style="color:red;">Hello world</text>
	</div>
</template>
<style>
	.text{
		font-size:160;
	}
</style>
<script></script>     
```
	
细心的同学，会发现weex-toolkit帮我们重载了页面。浏览器可以看到红闪闪的大写的“Hello world”字样。          

![](imgs/001_1.png)

weex中支持``style``和``class``来设定样式。但是font-size：160后面没有px。因此，css需要统一web和Native。weex做了兼容和取舍，目前支持的样式如下： http://alibaba.github.io/weex/doc/references/common-style.html （当然，这块个人不建议需要好好理解下，不是写什么样式都是支持的）。web的布局系统和引擎需要移植到多端还是很有挑战的，RN目前的实现也是一部分，Weex相对还实现了部分重要的属性，例如position:fixed。    


### 第6步：.html文件载体在哪    
我们既然运行了程序，那么一定有一个.html作为程序入口。其实，weex-toolkit给我们生成了相关文件。我们可以到hello.we同级目录下查找，就会发现有一个weex_tmp文件。该文件夹就是生成的可以执行的浏览器代码。       


### 第7步：最佳实践           
1. 能否去掉div标签？         
	明确的说，这个容器层是需要的。同时，只能有一个根节点。
	 		
2. 能否直接在div里写文字，像web一样？             
	答案是不可以，因为text组件是用来渲染文本的。在weex或者react native中，类似的这些标签不再是html元素了，而是组件。组件的意思是，每个组件承载各自的功能，区分明显；不像web那样自由。这就是首篇提到规范和约束。          
	   
3.	能否使用一些其它样式作为H5补充呢？          
	可以的。建议把样式直接写到index.html文件里面，不要写到.we文件中。这样就可以让样式只在浏览器里渲染，不影响Native。     
	       
4. 其它组件有哪些？哪些组件可以使用？     
	建议参考： http://alibaba.github.io/weex/doc/     
	没有的组件就不能使用了，例如span。        

**约束和规范只是让我们可以更好的工程化，别无其它。**	
	
		
	
		
	     

 
   

           
	
	
 
# angular-light-binding
A simple library that support two way binding with angular syntax
![alt text](http://s9.picofile.com/file/8317089618/two_way_data_binding_diagram.png)

http://htmlpreview.github.io/?https://github.com/abizebel/angular-light-binding/blob/master/demo.html


[=== ONLINE DEMO ===](http://htmlpreview.github.io/?https://github.com/abizebel/angular-light-binding/blob/master/demo.html)


<h3>Supports :</h3>
<ul>
  <li>attribute binding</li> 
  <pre>
  &lt;div style="width:{{width}}px"&gt;
  </pre>

  <li>text binding</li>  
  <pre>
  &lt;div&gt{{width}}&lt;/div&gt
  </pre> 
  <li>input binding</li>
  <pre>
  &lt;input ng-model="width"&gt
  </pre>
  <li>binding literal objects (reactivity nested objects)</li> 
  <pre>
    {{user.admin.name}}
  </pre>
</ul>



![alt text](http://s8.picofile.com/file/8317139242/Untitled.gif)

# angular-light
A simple library that support two way binding with angular syntax
![alt text](http://s9.picofile.com/file/8317089618/two_way_data_binding_diagram.png)
<h3>Supports :</h3>
<ul>
  <li>attribute binding</li>  
  <xmp><div style="width:{{width}}px"</xmp>
  <li>text binding</li>  

  
</ul>

<pre><span class="pl-c"><span class="pl-c">//</span> ajax(..) is some arbitrary Ajax function given by a library</span>
<span class="pl-k">var</span> data <span class="pl-k">=</span> <span class="pl-en">ajax</span>( <span class="pl-s"><span class="pl-pds">"</span>http://some.url.1<span class="pl-pds">"</span></span> );

<span class="pl-en">console</span>.<span class="pl-c1">log</span>( data );
<span class="pl-c"><span class="pl-c">//</span> Oops! `data` generally won't have the Ajax results</span></pre>

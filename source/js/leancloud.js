function incrementedKey(url) {
  return 'v_url' + escape(url);
}

function setIncremented(url, time) {
  document.cookie = incrementedKey(url) + '=' + time;
}

function hasIncrement(url) {
  if (document.cookie.length == 0) {
    return -1;
  }
  var key = incrementedKey(url);
  var c_start = document.cookie.indexOf(key + '=');
  if (c_start == -1) {
    return -1;
  }
  var c_start = document.cookie.indexOf('=', c_start);
  var c_end = document.cookie.indexOf(';', c_start);
  if (c_end == -1) {
    c_end = document.cookie.length;
  }
  return document.cookie.substring(c_start+1, c_end);
}


function increment(counter) {
  console.log('increment: ');
  console.log(counter);
  counter.fetchWhenSave(true);
  counter.increment('time');
  counter.save(null, {
    success: function(counter) {
      setIncremented(counter.get('url'), counter.get('time'));
    },
    error: function(counter, error) {
      console.log('Failed to save Visitor num, with error message: ' + error.message);
    }
  });
}

function setCount(Counter, url, countElement) {
  var newcounter = new Counter();

  var acl = new AV.ACL();
  acl.setPublicReadAccess(true);
  acl.setPublicWriteAccess(true);
  newcounter.setACL(acl);

  var $element = $(document.getElementById(url));
  var title = $element.attr('data-flag-title').trim();

  newcounter.set('title', title);
  newcounter.set('url', url);
  newcounter.set('time', 1);

  newcounter.save(null, {
    success: function(newcounter) {
      console.log('save success, title: ' + title + ' url: ' + url);
      $element.find(countElement).text(newcounter.get('time'));
    },
    error: function(newcounter, error) {
      $element.find(countElement).text(0);
      console.log('Failed to create, ' + error.message);
    }
  });
}

function processCounter(Counter, visitorElement, countElement) {
  var $visitors = $(visitorElement);
  var entries = [];
  $visitors.each(function(){
    entries.push($(this).attr('id').trim());
  });
  var query = new AV.Query(Counter);

  query.containedIn('url', entries);
  query.find()
    .then(function(results) {
      var processed = {}
      results.forEach(function(counter) {
        processed[counter.get('url')] = true;
        var $element = $(document.getElementById(counter.get('url')));
        if (hasIncrement(counter.get('url')) <= 0) {
          increment(counter);
        }
        $element.find(countElement).text(counter.get('time'));
      });
      entries.forEach(function(entrie){
        console.log('set entrie: ' + entrie)
        if (!processed[entrie]) {
          setCount(Counter, entrie, countElement);
        }
      });
    });
}

function setSiteView(visitor, count) {
  var $element = $(document.getElementById('site-visitors-count'));
  var url = $element.find(visitor).attr('id').trim();
  var view = hasIncrement(url);
  console.log(view);
  if (view > 0) {
    $element.find(count).text(view);
    document.getElementById('site-visitors-count').style.visibility = 'visible';
    return true;
  }
  return false;
}

$(function() {
  var VISITOR_ELEMENT = '.leancloud-visitors';
  var COUNT_ELEMENT = '.leancloud-visitors-count';

  var siteViewSeted = setSiteView(VISITOR_ELEMENT, COUNT_ELEMENT);

  var Counter = AV.Object.extend('Counter');
  processCounter(Counter, VISITOR_ELEMENT, COUNT_ELEMENT);
  if (!siteViewSeted) {
    document.getElementById('site-visitors-count').style.visibility = 'visible';
  }
});


var TwitterP = require('twitter');
var keys = require('./keys')

var Twitter = new TwitterP(keys);

Twitter.stream('statuses/filter', {track: '@get_altText'}, function(stream) {
  stream.on('data', function(tweet) {
    var m_id = tweet.id_str;
    var m_us = tweet.user.screen_name;
    var o_id = tweet.in_reply_to_status_id_str;

    if (o_id != null) {
      Twitter.get('statuses/show', {id: o_id, include_ext_alt_text: 'true'}, function(err, o_tweet){
        if(err) {
          console.log(err);
        }

        if (o_tweet.extended_entities == undefined || o_tweet.extended_entities['media'] == undefined) {
          tweetThis('You don\'t seem to be replying to a tweet containing an image. I might be wrong, this is all very confusing.', m_id, m_us);
        }

        else {
          var media = o_tweet.extended_entities['media'];
          var cont = '';
          for (var i = 0; i < media.length; i++) {
            if (media.length > 1) cont += (i+1) + '. Pic: ' + media[i].ext_alt_text + '\n';
            else cont += media[i].ext_alt_text;
          }
          tweetThis(cont, m_id, m_us);
        }
      })
    }
  });

  stream.on('err', function(err) {
    console.log(err);
  });
});

function tweetThis (content, to_id, to_us) {
  content = content.replace('null', 'There is no alt text for this image, i\'m sorry.');
  
  var content = '@' + to_us + ' ' + content;

  if (content.length <= 280) {
    var reply = {status: content, in_reply_to_status_id: to_id}
    Twitter.post('statuses/update', reply,  function(err, tweet){
      if(err){
        console.log(err);
      }
    });
  }

  else {
    var cont_arr = content.split(' ');
    cont_arr.splice(0,1);
    var part = '';

    while(part.length < 260){
      if (cont_arr.length == 0) break;
      part += cont_arr[0] + ' ';
      cont_arr.splice(0,1);
    }

    var reply = {status: '@' + to_us + ' ' + part, in_reply_to_status_id: to_id}
    Twitter.post('statuses/update', reply,  function(err, tweet){
      if(err){
        console.log(err);
      }
      tweetThis(cont_arr.join(' '), tweet.id_str, to_us);
    });
  }
}

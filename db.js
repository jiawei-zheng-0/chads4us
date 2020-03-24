const sqlite3 = require('sqlite3');
const path = require('path')

// Open database
let db = new sqlite3.Database('twitter.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
});

module.exports = {
    addUser: function (username, password, email, key, callback) {
        const addUserQuery = 'INSERT INTO User(username,password,email,key) VALUES(?,?,?,?)';
        db.run(addUserQuery, [username, password, email, key], (err, rows) => {
            if (err) {
                callback(err);
            }
            else {
                callback(null, rows);
            }
        });
    },
    verify: function (email, key, callback) {
        const getKeyQuery = 'UPDATE User SET verified=1 WHERE email=? AND (key=? OR ?="abracadabra")';
        db.run(getKeyQuery, [email, key, key], (err, row) => {
            if (err) {
                callback(null, 0);
            }
            else {
                db.get('SELECT verified FROM User WHERE email=?', [email], (err, result) => {
                    if (err) {
                        callback(null, 0);
                    } else if (result && result.verified === 1) {
                        callback(null, 1);
                    } else {
                        callback(null, 0);
                    }
                })
            }
        });
    },
    login: function (username, password, callback) {
        const loginQuery = 'SELECT password, verified FROM User WHERE username = ?';
        db.get(loginQuery, [username], (err, row) => {
            if (err || !row) {
                callback(null, 0); //username not found
            }
            else {
                if (password === row.password && row.verified === 1) {
                    callback(null, 1);
                }
                else {
                    callback(null, 0);
                }
            }
        });
    },
    getUser: function (username, callback) {
        const getUserQuery = 'SELECT * FROM User WHERE username = ?';
        db.get(getUserQuery, [username], (err, row) => {
            if (err) {
                callback(err);
            } else {
                callback(null, row);
            }

        });
    },
    addTweet: function (tweet, callback) {
        const addTweetQuery = 'INSERT INTO Tweets(id,username,originalUsername,content,parent,childType,media,timestamp) VALUES(?,?,?,?,?,?,?,strftime(\'%s\',\'now\'))';
        db.run(addTweetQuery, [tweet.id, tweet.username, tweet.originalUsername, tweet.content, tweet.parent, tweet.childType, tweet.media], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, 1);
            }
        });
    },
    getTweet: function (id, callback) {
        const getTweetQuery = 'SELECT * FROM Tweets WHERE id=?';
        db.get(getTweetQuery, [id], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    deleteTweet: function (id, callback) {
        const deleteTweetQuery = 'DELETE FROM Tweets WHERE id=?';
        db.get(deleteTweetQuery, [id], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    search: function (timestamp, limit, query, username, following, followingNames, rank, parent, replies, media, callback) {
        if (typeof replies !== 'undefined' && replies == false) {
            parent = false;
        }
        let searchQuery = 'SELECT * FROM Tweets WHERE timestamp<=?';
        if (query) {
            let words = query.split(" ");
            searchQuery += ` AND (`;
            console.log(words);
            words.forEach(word => {
                searchQuery += `content LIKE '%${word}%' OR `;
            });
            searchQuery = searchQuery.slice(0, -3);
            searchQuery += ')'
        }
        if (username) {
            searchQuery += ` AND username='${username}'`;
        }
        else if (following) {//filter by followed users
            searchQuery += ` AND (`;
            followingNames.forEach(user => {
                searchQuery += `username = '${user}' OR `;
            });
            searchQuery = searchQuery.slice(0, -3);
            searchQuery += ')'
        }
        if (parent) {
            searchQuery += ` AND parent='${parent}'`;
        }
        if (typeof replies !== 'undefined' && replies == false) {
            searchQuery += ` AND childType != 'reply'`;
        }
        console.log(media);
        if (media) {
            searchQuery += ` AND media != 'null'`;
        }
        if (rank === 'interest') {
            searchQuery += ' ORDER BY (retweeted+likes) DESC LIMIT ?';
        }
        else {
            searchQuery += ' ORDER BY timestamp DESC LIMIT ?';
        }
        console.log(searchQuery);
        db.all(searchQuery, [timestamp, limit], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    getProfile: function (username, callback) {
        const getProfileQuery = 'SELECT * FROM User WHERE username=?';
        db.get(getProfileQuery, [username], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    getFollowers: function (username, limit, callback) {
        const getFollowersQuery = 'SELECT Follower FROM Follower WHERE User=? LIMIT ?';
        db.all(getFollowersQuery, [username, limit], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    getFollowing: function (username, limit, callback) {
        const getFollowingQuery = 'SELECT User FROM Follower WHERE Follower=? LIMIT ?';
        db.all(getFollowingQuery, [username, limit], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    getTweetsFromUser: function (username, limit, callback) {
        const getTweetQuery = 'SELECT * FROM Tweets WHERE username=? ORDER BY timestamp DESC LIMIT ?';
        db.all(getTweetQuery, [username, limit], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    follow: function (user, follower, callback) {
        const followQuery = 'INSERT INTO Follower(User,Follower) VALUES(?,?)';
        db.run(followQuery, [user, follower], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    unfollow: function (user, follower, callback) {
        const unfollowQuery = 'DELETE FROM Follower WHERE User=? AND Follower=?';
        db.run(unfollowQuery, [user, follower], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    incrementFollowCounts: function (user, follower, callback) {
        const incrementFollowingQuery = 'UPDATE User SET following=following+1 WHERE username=?';
        const incrementFollowerQuery = 'UPDATE User SET followers=followers+1 WHERE username=?';
        db.run(incrementFollowingQuery, [follower], (err, result) => {
            if (err) {
                callback(err);
            } else {
                db.run(incrementFollowerQuery, [user], (err, result) => {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, result);
                    }
                });
            }
        });
    },
    decrementFollowCounts: function (user, follower, callback) {
        const decrementFollowingQuery = 'UPDATE User SET following=following-1 WHERE username=?';
        const decrementFollowerQuery = 'UPDATE User SET followers=followers-1 WHERE username=?';
        db.run(decrementFollowingQuery, [follower], (err, result) => {
            if (err) {
                callback(err);
            } else {
                db.run(decrementFollowerQuery, [user], (err, result) => {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, result);
                    }
                });
            }
        });
    },
    incrementRetweetedCount: function (id, callback) {
        const incrementRetweetedQuery = 'UPDATE Tweets SET retweeted=retweeted+1 WHERE id=?';
        db.run(incrementRetweetedQuery, [id], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    decrementRetweetedCount: function (id, callback) {
        const decrementRetweetedQuery = 'UPDATE Tweets SET retweeted=retweeted-1 WHERE id=?';
        db.run(decrementRetweetedQuery, [id], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    incrementLikesCount: function (id, callback) {
        const incrementLikesQuery = 'UPDATE Tweets SET likes=likes+1 WHERE id=?';
        db.run(incrementLikesQuery, [id], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    decrementLikesCount: function (id, callback) {
        const decrementLikesQuery = 'UPDATE Tweets SET likes=likes-1 WHERE id=?';
        db.run(decrementLikesQuery, [id], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    addMedia: function (username, mediaid, timestamp, callback) {
        const addMediaQuery = 'INSERT INTO Media(username,mediaid,timestamp) VALUES(?,?,?)';
        db.run(addMediaQuery, [username, mediaid, timestamp], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    //returns array of tweets using media
    mediaIDUsed: function (mediaID, callback) {
        const followQuery = `SELECT * FROM Tweets WHERE media LIKE '%${mediaID}%'`;
        db.all(followQuery, [], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    //returns username of user that uploaded media
    mediaOwner: function (mediaID, callback) {
        const followQuery = `SELECT username FROM Media WHERE mediaid=?`;
        db.get(followQuery, [mediaID], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    mediaValid: function (username, mediaIDs, callback) {
        console.log('start checking media ids')
        mediaValid = true;
        count = 0;
        if (!mediaIDs) {
            callback(null, true);
        }
        else {
            mediaIDs.forEach(mediaID => {
                console.log(mediaID)
                const mediaIDUsedQuery = `SELECT * FROM Tweets WHERE media LIKE '%${mediaID}%'`;
                const mediaOwnerQuery = `SELECT username FROM Media WHERE mediaid=?`;
                db.all(mediaIDUsedQuery, [], (err, result) => {
                    if (err) {
                        mediaValid = false;
                        callback(err);
                    } else {
                        //console.log(result.length)
                        if (result.length > 0) {
                            console.log('media already used db')
                            mediaValid = false;
                        }
                        db.get(mediaOwnerQuery, [mediaID], (err, result) => {
                            if (err) {
                                mediaValid = false;
                                callback(err);
                            } else {
                                if (result.username != username) {
                                    console.log('media not owned by username db')
                                    mediaValid = false;
                                }
                            }
                            if ((mediaID === mediaIDs[mediaIDs.length - 1]) && (mediaValid == true)) {
                                console.log('callback true')
                                callback(null, true);
                            }
                            else if ((mediaID === mediaIDs[mediaIDs.length - 1]) && (mediaValid == false)) {
                                console.log('callback false')
                                callback(null, false);
                            }
                        });

                    }
                });
            });
        }
    },
    like: function (username, tweetID, callback) {
        console.log(`${username} , ${tweetID}`);
        const likeQuery = `INSERT INTO Likes(username,tweet) VALUES(?,?)`;
        db.run(likeQuery, [username, tweetID], (err, result) => {
            if (err) {
                console.log(err)
                callback('Tweet already liked');
            } else {
                const incrementLikesQuery = 'UPDATE Tweets SET likes=likes+1 WHERE id=?';
                db.run(incrementLikesQuery, [tweetID], (err, result) => {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, result);
                    }
                });
            }
        });
    },
    unlike: function (username, tweetID, callback) {
        const unlikeQuery = `DELETE FROM Likes WHERE username=? AND tweet=?`;
        const getRowQuery = `SELECT * FROM Likes WHERE username=? AND tweet=?`;
        db.get(getRowQuery, [username, tweetID], (err, result) => {
            if (err) {
                callback(err);
            } else {
                if (result) {
                    db.run(unlikeQuery, [username, tweetID], (err, result) => {
                        if (err) {
                            callback(err);
                        } else {
                            const decrementLikesQuery = 'UPDATE Tweets SET likes=likes-1 WHERE id=?';
                            db.run(decrementLikesQuery, [tweetID], (err, result) => {
                                if (err) {
                                    callback(err);
                                } else {
                                    callback(null, result);
                                }
                            });
                        }
                    });
                }
                else {
                    callback('not liked');
                }
            }
        });
    },
    isLiked: function(username, tweetID, callback) {
        const isLikedQuery = `SELECT tweet FROM Likes WHERE username=? AND tweet=?`;
        db.get(isLikedQuery, [username, tweetID], (err, result) => {
            if (err) {
                callback(err);
            } else {
                if (result) {
                    callback(null, 1);
                } else {
                    callback(null, 0);
                }
            }
        })
    },
    getMediaTweets: function (mediaID, callback) {
        const gettMediaTweetsQuery = `SELECT * FROM Tweets WHERE media LIKE '%${mediaID}%'`;
        db.get(gettMediaTweetsQuery, [], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    getMediaTime: function (mediaID, callback) {
        const getMediaTimeQuery = `SELECT * FROM Media WHERE mediaid=?`;
        db.get(getMediaTimeQuery, [mediaID], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },
    setMediaTime: function (mediaID, timestamp, callback) {
        const setMediaTimeQuery = `UPDATE Media SET timestamp=? WHERE mediaid=?`;
        db.get(setMediaTimeQuery, [timestamp, mediaID], (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    }
};
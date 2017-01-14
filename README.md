Pollen Chart
============

Chart the [European Pollen Database](http://www.europeanpollendatabase.net/)


Synopsis
--------

[Pollen Chart](https://pollen.vinc.cc) is a website dedicated to help
exploring the [European Pollen Database](http://www.europeanpollendatabase.net/)
for a better understanding of our environment.


Installation
------------

To get the source do the following:

    $ git clone git://github.com/vinc/pollen.vinc.cc.git
    $ cd pollen.vinc.cc

Then visit the [download page](http://www.europeanpollendatabase.net/data/downloads/)
of the EPD and download a Postgres archive of the database:

    $ wget http://www.europeanpollendatabase.net/data/downloads/image/epd-postgres-distribution.zip
    $ unzip epd-postgres-distribution.zip
    $ gunzip dumpall_epd_db.sql.gz
    $ sed -i "s/epd\|wwwadm/$POSTGRES_USER/g" dumpall_epd_db.sql
    $ psql $POSTGRES_DATABASE < dumpall_epd_db.sql

Where `$POSTGRES_DATABASE` is your database and `$POSTGRES_USER` your database
user. You can avoid altering the dump by creating the two required users `epd`
and `wwwadm` instead.

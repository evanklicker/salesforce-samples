# Enhanced Functionality

I'm trying to stuff as much functionality into this component as possible. Right now, the following capabilities are planned to be implemented (in no particular order):
- Sorting rows
- Paging
- Searching
- Filtering
- Selecting rows
- Row actions
- Inline editing
- Customize which columns display and in what order

If I complete all the above, the I may spend some time increasing the volume of records able that can be handled by this component. With just the above specifications all done client-side, it probably wouldn't be able to effectively handle more than 2,000 records (the limit of the number of records returned by a single soql query). Some simple server-side handling could raise that up to 200,000 (100 queries * 2000 records per query), but by being smart we could raise that quite a bit more.
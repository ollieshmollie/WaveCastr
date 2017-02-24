require 'rails_helper'

RSpec.describe User, type: :model do
  let!(:episode) { Episode.new(name: "My podcast", description: "My first one!") }
  let!(:user) { User.create!(email: "oliver@gmail.com", password: "password") }
  let(:guest) { episode.guests.new(name: "Oliver") }
  let(:track) { Track.new(recordable_id: 1, recordable_type: "Guest", s3_string: "secret") }

  context "associations" do
    it "has many episodes" do
      user.episodes << episode
      expect(user.episodes).to include(episode)
    end

    it "has many tracks" do
      user.tracks << track
      expect(user.tracks).to include(track)
    end
  end
end
